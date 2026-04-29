import React, { useState, useRef } from 'react';
import { Plus, AlertTriangle, Camera, CheckCircle2, Package, X, Loader2 } from 'lucide-react';
import client from './apolloClient';
import { gql } from '@apollo/client';
import { uploadImageToSupabase } from './features/quickaction/uploadImageToSupabase';

// Composant QuickActionPro : bouton flottant + modal terrain
const QuickActionPro = ({ projectId, activeDocumentId }: { projectId: string, activeDocumentId?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    type: 'INCIDENT' as 'INCIDENT' | 'PHOTO' | 'TASK_DONE' | 'DELIVERY',
    description: '',
    image: null as File | null,
    preview: null as string | null
  });

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

  const CREATE_EVENT = gql`
    mutation CreateProjectEvent($input: CreateProjectEventInput!) {
      createProjectEvent(input: $input) {
        id
        project_id
        type
        description
        blueprint_id
        metadata
        created_at
      }
    }
  `;

  const handleSubmit = async () => {
    setLoading(true);
    triggerHaptic();
    try {
      // 1. Upload image réelle sur Supabase Storage
      let imagePath = null;
      if (form.image) {
        imagePath = await uploadImageToSupabase(form.image, projectId);
      }
      // 2. Envoi de l'event via GraphQL
      const input = {
        project_id: projectId,
        type: form.type,
        description: form.description,
        blueprint_id: activeDocumentId || null,
        metadata: {
          image_url: imagePath,
          timestamp: new Date().toISOString(),
          os: navigator.platform
        }
      };
      await client.mutate({
        mutation: CREATE_EVENT,
        variables: { input },
      });
      setLoading(false);
      setIsOpen(false);
      setForm({ type: 'INCIDENT', description: '', image: null, preview: null });
      navigator.vibrate?.([100, 50, 100]);
    } catch (err) {
      console.error("Erreur de transmission", err);
      setLoading(false);
    }
  };

  if (!isOpen) return (
    <button onClick={() => { setIsOpen(true); triggerHaptic(); }} className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50">
      <Plus size={32} />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Signalement Rapide</h3>
          <button onClick={() => setIsOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-500"><X size={20}/></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['INCIDENT', 'PHOTO', 'TASK_DONE', 'DELIVERY'].map((t) => (
            <button key={t} onClick={() => setForm({ ...form, type: t as any })}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${form.type === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}>
              {t === 'INCIDENT' && <AlertTriangle size={24}/>}
              {t === 'PHOTO' && <Camera size={24}/>}
              {t === 'TASK_DONE' && <CheckCircle2 size={24}/>}
              {t === 'DELIVERY' && <Package size={24}/>}
              <span className="text-[10px] font-bold uppercase">{t.replace('_', ' ')}</span>
            </button>
          ))}
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
        <textarea 
          placeholder={form.type === 'INCIDENT' ? "Quel est le problème ?" : "Commentaire..."}
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
          {loading ? <Loader2 className="animate-spin" /> : "ENVOYER AU BUREAU"}
        </button>
      </div>
    </div>
  );
};

export default QuickActionPro;
