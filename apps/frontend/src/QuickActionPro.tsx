import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, AlertTriangle, Camera, CheckCircle2, Package, X, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadImageToSupabase } from './features/quickaction/uploadImageToSupabase';
import { supabase } from './lib/supabase';
import { emit } from './lib/events';
import { useToast } from './ui/ToastProvider';
import { useOfflineQueue } from './hooks/useOfflineQueue';
import { useOfflineStatus } from './hooks/useOfflineStatus';
import { addToQueue } from './services/offline/queue';

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

interface RecentActionItem {
  id: string;
  type: QuickActionType;
  description: string;
  mode: 'online' | 'offline';
  createdAt: number;
}

const OFFLINE_TYPE_LABELS: Record<string, string> = {
  incident_create: 'Incident',
  incident_update: 'Incident',
  photo_upload: 'Photo',
  task_update: 'Tache',
  task_create: 'Tache',
  delivery_create: 'Livraison',
  event_log: 'Journal',
};

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
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast() || {};
  const [recentActions, setRecentActions] = useState<RecentActionItem[]>([]);

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
    items: queueItems,
    pendingCount,
    failedCount,
    isSyncing: isProcessing,
    forceSync: processQueue,
    retryFailed,
    clearFailed,
  } = useOfflineQueue();
  const { isOnline } = useOfflineStatus();

  const addToQueueLocal = async (item: OfflineQuickActionItem) => {
    await addToQueue('incident_create', {
      id: item.id,
      project_id: item.projectId,
      title: `[${item.payload.type}] ${item.payload.description}`,
      description: item.payload.description,
      severity: item.payload.priority === 'high' ? 'high' : item.payload.priority === 'low' ? 'low' : 'medium',
      status: 'submitted',
    });
  };

  const queueLabel = useMemo(() => {
    if (pendingCount === 0) return null;
    return `${pendingCount} action${pendingCount > 1 ? 's' : ''} en attente`;
  }, [pendingCount]);

  const syncingCount = useMemo(
    () => queueItems.filter((item) => item.status === 'syncing').length,
    [queueItems]
  );

  const queueTotal = pendingCount + syncingCount + failedCount;
  const queueState = useMemo(() => {
    if (failedCount > 0) {
      return {
        tone: 'danger' as const,
        title: 'Synchronisation en erreur',
        detail: `${failedCount} action${failedCount > 1 ? 's' : ''} en echec.`,
      };
    }
    if (syncingCount > 0) {
      return {
        tone: 'info' as const,
        title: 'Synchronisation en cours',
        detail: `${syncingCount} action${syncingCount > 1 ? 's' : ''} en traitement.`,
      };
    }
    if (pendingCount > 0) {
      return {
        tone: 'waiting' as const,
        title: isOnline ? 'Actions en attente de sync' : 'Mode hors ligne actif',
        detail: `File locale: ${pendingCount} element${pendingCount > 1 ? 's' : ''}.`,
      };
    }
    return {
      tone: 'ok' as const,
      title: 'Synchronisation a jour',
      detail: 'Aucune action en attente.',
    };
  }, [failedCount, isOnline, pendingCount, syncingCount]);

  const recentQueueItems = useMemo(() => queueItems.slice(0, 4), [queueItems]);

  const descriptionLength = form.description.trim().length;
  const isIncidentWithoutDescription = form.type === 'INCIDENT' && descriptionLength === 0;

  // Vibration mobile
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const resetForm = useCallback(() => {
    setForm({ type: 'INCIDENT', description: '', zone: '', priority: 'medium', image: null, preview: null });
    setFormError(null);
  }, []);

  const pushRecentAction = useCallback((mode: 'online' | 'offline') => {
    setRecentActions((previous) => [
      {
        id: crypto.randomUUID(),
        type: form.type,
        description: form.description.trim() || ACTION_CONFIG[form.type].label,
        mode,
        createdAt: Date.now(),
      },
      ...previous,
    ].slice(0, 5));
  }, [form.description, form.type]);

  useEffect(() => {
    if (!isOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isOpen, loading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, image: file, preview: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = async () => {
    if (isIncidentWithoutDescription) {
      setFormError('La description est requise pour un incident.');
      return;
    }

    setFormError(null);
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
        await addToQueueLocal({
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
        resetForm();
        pushRecentAction('offline');
        showToast?.('Action enregistree hors ligne. Synchronisation au retour reseau.', 'success');
      } else {
        await submitAction(submission);
        setIsOpen(false);
        resetForm();
        pushRecentAction('online');
        showToast?.('Signalement transmis', 'success');
        navigator.vibrate?.([100, 50, 100]);
      }
    } catch (err) {
      console.error("Erreur de transmission", err);
      setFormError('La transmission a echoue. Verifiez votre connexion puis reessayez.');
      showToast?.('Erreur lors de la transmission', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return (
    <button onClick={() => { setIsOpen(true); triggerHaptic(); }} className="bf-quickaction-fab fixed bottom-5 right-5 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50" aria-label="Ouvrir actions rapides terrain">
      <Plus size={32} />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="bf-modal w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] shadow-2xl animate-in fade-in slide-in-from-bottom-10 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-slate-200/70">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Signalement Rapide</h3>
          <button onClick={() => !loading && setIsOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 disabled:opacity-40" disabled={loading} aria-label="Fermer les actions rapides"><X size={20}/></button>
        </div>

        <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-4">

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          {loading ? 'Transmission en cours... merci de patienter.' : `Action en cours: ${ACTION_CONFIG[form.type].label}.`}
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
          {isOnline && pendingCount > 0 ? (
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

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Suivi synchronisation</p>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">En attente: {pendingCount}</span>
              <span className="rounded-full bg-cyan-100 px-2 py-0.5 font-semibold text-cyan-700">En cours: {syncingCount}</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700">Echecs: {failedCount}</span>
            </div>
          </div>

          <div className={`rounded-xl border px-3 py-2 text-xs ${
            queueState.tone === 'danger'
              ? 'border-red-200 bg-red-50 text-red-700'
              : queueState.tone === 'info'
                ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                : queueState.tone === 'waiting'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            <p className="font-semibold">{queueState.title}</p>
            <p className="mt-0.5">{queueState.detail}</p>
            <div className="mt-2 h-1.5 rounded-full bg-black/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  queueState.tone === 'danger'
                    ? 'bg-red-500'
                    : queueState.tone === 'info'
                      ? 'bg-cyan-500'
                      : queueState.tone === 'waiting'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                }`}
                style={{ width: `${queueTotal === 0 ? 100 : Math.min(100, (syncingCount + pendingCount) * 20 + failedCount * 30)}%` }}
              />
            </div>
          </div>

          {recentQueueItems.length > 0 ? (
            <ul className="space-y-2 text-xs">
              {recentQueueItems.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-700 truncate">{OFFLINE_TYPE_LABELS[item.type] ?? item.type}</p>
                    <p className="text-slate-500 truncate">{String(item.payload.description ?? 'Action sans description')}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 font-semibold ${
                    item.status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : item.status === 'syncing'
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status === 'failed' ? 'Echec' : item.status === 'syncing' ? 'Sync' : 'Attente'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">Aucune action en file hors ligne.</p>
          )}

          {(failedCount > 0 || pendingCount > 0) ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void processQueue()}
                disabled={!isOnline || isProcessing}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:text-slate-300"
              >
                Forcer sync
              </button>
              {failedCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void retryFailed()}
                  disabled={!isOnline || isProcessing}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:text-red-300"
                >
                  Relancer echecs
                </button>
              ) : null}
              {failedCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void clearFailed()}
                  disabled={isProcessing}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:text-slate-300"
                >
                  Nettoyer echecs
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {recentActions.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Actions recentes</p>
            <ul className="space-y-2 text-xs">
              {recentActions.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-700 truncate">{ACTION_CONFIG[item.type].label}</p>
                    <p className="text-slate-500 truncate">{item.description}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 font-semibold ${item.mode === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.mode === 'online' ? 'Envoye' : 'Hors ligne'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {ACTION_TYPES.map((actionType) => (
            <button key={actionType} onClick={() => setForm({ ...form, type: actionType })}
              className={`min-h-20 sm:min-h-24 p-3 sm:p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${form.type === actionType ? 'bf-action-tile-active' : 'border-slate-100 text-slate-400'}`}>
              {actionType === 'INCIDENT' && <AlertTriangle size={24}/>}
              {actionType === 'PHOTO' && <Camera size={24}/>}
              {actionType === 'TASK_DONE' && <CheckCircle2 size={24}/>}
              {actionType === 'DELIVERY' && <Package size={24}/>}
              <span className="text-[11px] font-bold uppercase leading-tight text-center">{ACTION_CONFIG[actionType].label}</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm font-bold text-slate-900">{ACTION_CONFIG[form.type].label}</p>
          <p className="mt-1 text-sm text-slate-600">{ACTION_CONFIG[form.type].helper}</p>
        </div>

        {formError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {formError}
          </div>
        ) : null}

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
          className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-base"
          rows={3}
          value={form.description}
          onChange={(e) => {
            setForm({...form, description: e.target.value});
            if (formError) setFormError(null);
          }}
        />
        <div className="flex items-center justify-between text-xs">
          <span className={`${isIncidentWithoutDescription ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
            {form.type === 'INCIDENT' ? 'Description obligatoire' : 'Description recommandee'}
          </span>
          <span className="text-slate-500">{descriptionLength} caractere(s)</span>
        </div>

        </div>

        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200/80 bg-white/95 backdrop-blur sticky bottom-0">
          <button
            type="button"
            onClick={() => !loading && setIsOpen(false)}
            className="w-1/3 rounded-xl border border-slate-200 py-4 text-sm font-semibold text-slate-700 disabled:opacity-40"
            disabled={loading}
          >
            Annuler
          </button>
        <button 
          disabled={loading || isIncidentWithoutDescription}
          onClick={handleSubmit}
          className="w-2/3 bg-slate-900 text-white py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:bg-slate-200 active:bg-blue-600"
        >
          {loading ? <Loader2 className="animate-spin" /> : isOnline ? ACTION_CONFIG[form.type].submitLabel : 'Enregistrer hors ligne'}
        </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActionPro;
