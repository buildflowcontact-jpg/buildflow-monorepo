import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Plus, AlertTriangle, Camera, CheckCircle2, Package, X, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadImageToSupabase } from './features/quickaction/uploadImageToSupabase';
import { supabase } from './lib/supabase';
import { emit } from './lib/events';
import { useToast } from './ui/ToastProvider';
import { useOfflineQueue } from './hooks/useOfflineQueue';

type QuickActionType = 'INCIDENT' | 'PHOTO' | 'TASK_DONE' | 'DELIVERY';

const ACTION_TYPES: QuickActionType[] = ['INCIDENT', 'PHOTO', 'TASK_DONE', 'DELIVERY'];

const ACTION_CONFIG: Record<QuickActionType, { label: string; helper: string; submitLabel: string }> = {
  INCIDENT: {
    label: 'Incident',
    helper: 'Signaler un probleme, un blocage ou un risque terrain.',
    submitLabel: 'Envoyer l incident',
  },
  PHOTO: {
    label: 'Photo',
    helper: 'Documenter visuellement une situation ou un avancement.',
    submitLabel: 'Publier la photo',
  },
  TASK_DONE: {
    label: 'Tache terminee',
    helper: 'Confirmer qu une action chantier vient d etre terminee.',
    submitLabel: 'Confirmer la tache',
  },
  DELIVERY: {
    label: 'Livraison',
    helper: 'Tracer une reception de materiel ou d equipement.',
    submitLabel: 'Enregistrer la livraison',
  },
};

interface QuickActionProProps {
  projectId: string;
  activeDocumentId?: string;
}

interface CreatedProjectEvent {
  id: string;
}

interface QuickActionSubmission {
  type: QuickActionType;
  description: string;
  zone: string;
  priority: string;
  imageFile?: File | null;
  imageDataUrl?: string | null;
}

interface OfflineQuickActionItem {
  id: string;
  projectId: string;
  activeDocumentId?: string;
  createdAt: string;
  payload: {
    type: QuickActionType;
    description: string;
    zone: string;
    priority: string;
    imageDataUrl?: string | null;
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, content] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] ?? 'image/jpeg';
  const binary = window.atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], filename, { type: mime });
}

// Composant QuickActionPro : bouton flottant + modal terrain
const QuickActionPro = ({ projectId, activeDocumentId }: QuickActionProProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast() || {};

  const [form, setForm] = useState({
    type: 'INCIDENT' as QuickActionType,
    description: '',
    zone: '',
    priority: 'medium',
    image: null as File | null,
    preview: null as string | null
  });

  const submitAction = useCallback(async (submission: QuickActionSubmission, overrideProjectId?: string, overrideDocumentId?: string) => {
    let imagePath = null;
    const effectiveProjectId = overrideProjectId ?? projectId;
    const effectiveDocumentId = overrideDocumentId ?? activeDocumentId;

    if (submission.imageFile) {
      imagePath = await uploadImageToSupabase(submission.imageFile, effectiveProjectId);
    }

    if (!submission.imageFile && submission.imageDataUrl) {
      const restoredFile = dataUrlToFile(submission.imageDataUrl, `offline-${Date.now()}.jpg`);
      imagePath = await uploadImageToSupabase(restoredFile, effectiveProjectId);
    }

    const input = {
      project_id: effectiveProjectId,
      event_type: submission.type,
      event_data: {
        description: submission.description,
        document_id: effectiveDocumentId || null,
        zone: submission.zone || null,
        priority: submission.priority,
        image_url: imagePath,
        timestamp: new Date().toISOString(),
        os: navigator.platform,
      },
    };

    const { data, error } = await supabase
      .from('project_events')
      .insert(input)
      .select()
      .single();

    const createdEvent = data as CreatedProjectEvent | null;

    if (error) {
      throw error;
    }

    if (createdEvent) {
      if (submission.type === 'INCIDENT') {
        await emit({
          type: 'INCIDENT_CREATED',
          payload: {
            eventId: createdEvent.id,
            projectId: effectiveProjectId,
            documentId: effectiveDocumentId,
          },
        });
      }

      if (submission.type === 'TASK_DONE') {
        await emit({
          type: 'TASK_COMPLETED',
          payload: {
            taskId: createdEvent.id,
            projectId: effectiveProjectId,
          },
        });
      }

      if (submission.type === 'DELIVERY') {
        await emit({
          type: 'DELIVERY_RECEIVED',
          payload: {
            eventId: createdEvent.id,
            projectId: effectiveProjectId,
          },
        });
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['project-events', effectiveProjectId] });
  }, [activeDocumentId, projectId, queryClient]);

  const {
    queue,
    addToQueue,
    processQueue,
    isOnline,
    isProcessing,
  } = useOfflineQueue<OfflineQuickActionItem>({
    storeName: 'quick-actions',
    processItem: async (item) => {
      await submitAction(
        {
          type: item.payload.type,
          description: item.payload.description,
          zone: item.payload.zone,
          priority: item.payload.priority,
          imageDataUrl: item.payload.imageDataUrl,
        },
        item.projectId,
        item.activeDocumentId,
      );
    },
  });

  const queueLabel = useMemo(() => {
    if (queue.length === 0) {
      return null;
    }

    return `${queue.length} action${queue.length > 1 ? 's' : ''} en attente`;
  }, [queue.length]);

  // Vibration mobile
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, image: file, preview: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    triggerHaptic();
    try {
      const submission: QuickActionSubmission = {
        type: form.type,
        description: form.description,
        zone: form.zone,
        priority: form.priority,
        imageFile: form.image,
      };

      if (!isOnline) {
        const imageDataUrl = form.image ? await fileToDataUrl(form.image) : null;
        await addToQueue({
          id: crypto.randomUUID(),
          projectId,
          activeDocumentId,
          createdAt: new Date().toISOString(),
          payload: {
            type: submission.type,
            description: submission.description,
            zone: submission.zone,
            priority: submission.priority,
            imageDataUrl,
          },
        });

        setIsOpen(false);
        setForm({ type: 'INCIDENT', description: '', zone: '', priority: 'medium', image: null, preview: null });
        showToast?.('Action enregistree hors ligne. Synchronisation au retour reseau.', 'success');
      } else {
        await submitAction(submission);
        setIsOpen(false);
        setForm({ type: 'INCIDENT', description: '', zone: '', priority: 'medium', image: null, preview: null });
        showToast?.('Signalement transmis', 'success');
        navigator.vibrate?.([100, 50, 100]);
      }
    } catch (err) {
      console.error("Erreur de transmission", err);
      showToast?.('Erreur lors de la transmission', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return (
    <button onClick={() => { setIsOpen(true); triggerHaptic(); }} className="bf-quickaction-fab fixed bottom-6 right-6 w-16 h-16 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50">
      <Plus size={32} />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center">
      <div className="bf-modal w-full max-w-lg p-6 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Signalement Rapide</h3>
          <button onClick={() => setIsOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-500"><X size={20}/></button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Contexte chantier</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-600">Projet actif</span>
            {activeDocumentId ? <span className="rounded-full bg-cyan-100 px-2.5 py-1 font-semibold text-cyan-700">Document selectionne</span> : <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">Aucun document selectionne</span>}
            <span className={`rounded-full px-2.5 py-1 font-semibold ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
            {queueLabel ? <span className="rounded-full bg-slate-900 px-2.5 py-1 font-semibold text-white">{queueLabel}</span> : null}
          </div>
          {!isOnline ? <p className="mt-2 text-xs text-orange-700">Les actions sont stockees sur l appareil puis rejouees automatiquement a la reconnexion.</p> : null}
          {isOnline && queue.length > 0 ? (
            <button
              type="button"
              onClick={() => void processQueue()}
              disabled={isProcessing}
              className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
            >
              {isProcessing ? 'Synchronisation...' : 'Synchroniser maintenant'}
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ACTION_TYPES.map((actionType) => (
            <button key={actionType} onClick={() => setForm({ ...form, type: actionType })}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${form.type === actionType ? 'bf-action-tile-active' : 'border-slate-100 text-slate-400'}`}>
              {actionType === 'INCIDENT' && <AlertTriangle size={24}/>}
              {actionType === 'PHOTO' && <Camera size={24}/>}
              {actionType === 'TASK_DONE' && <CheckCircle2 size={24}/>}
              {actionType === 'DELIVERY' && <Package size={24}/>}
              <span className="text-[10px] font-bold uppercase">{ACTION_CONFIG[actionType].label}</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm font-bold text-slate-900">{ACTION_CONFIG[form.type].label}</p>
          <p className="mt-1 text-sm text-slate-600">{ACTION_CONFIG[form.type].helper}</p>
        </div>

        <div className="relative group">
          <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
          {form.preview ? (
            <div className="relative h-48 w-full rounded-xl overflow-hidden shadow-inner">
              <img src={form.preview} className="w-full h-full object-cover" />
              <button onClick={() => setForm({...form, preview: null, image: null})} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={16}/></button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
              <Camera size={32} />
              <span className="text-sm mt-2">Prendre une photo (Optionnel)</span>
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Zone / lot</label>
            <input
              type="text"
              value={form.zone}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
              placeholder="Ex: R+2 facade nord"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Priorite</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="low">Faible</option>
              <option value="medium">Normale</option>
              <option value="high">Haute</option>
              <option value="critical">Critique</option>
            </select>
          </div>
        </div>

        <textarea 
          placeholder={form.type === 'INCIDENT' ? 'Quel est le probleme ?' : 'Commentaire operationnel...'}
          className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-lg"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({...form, description: e.target.value})}
        />
        <button 
          disabled={loading || (form.type === 'INCIDENT' && !form.description)}
          onClick={handleSubmit}
          className="w-full bg-slate-900 text-white py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:bg-slate-200 active:bg-blue-600"
        >
          {loading ? <Loader2 className="animate-spin" /> : isOnline ? ACTION_CONFIG[form.type].submitLabel : 'Enregistrer hors ligne'}
        </button>
      </div>
    </div>
  );
};

export default QuickActionPro;
