// modules/incidents/components/IncidentForm.tsx
import React, { useState } from 'react';
import { useCreateIncident } from '../hooks/useCreateIncident';
import type { CreateIncidentPayload, IncidentSeverity } from '../types';
import { uploadAttachmentToSupabase } from '@/modules/approvisionnement/services/uploadAttachmentToSupabase';
import { supabase } from '@/lib/supabase';

interface IncidentFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export const IncidentForm: React.FC<IncidentFormProps> = ({ projectId, onSuccess }) => {
  const fieldClassName = 'bf-input w-full';
  const selectClassName = 'bf-select w-full rounded-xl px-3 py-2';
  const areaClassName = 'bf-textarea w-full rounded-xl px-3 py-2';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [photos, setPhotos] = useState<File[]>([]);

  const { mutate, isPending, isError } = useCreateIncident();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: CreateIncidentPayload = {
      project_id: projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      severity,
    };

    mutate(payload, {
      onSuccess: async (result: any) => {
        const incidentId = result?.data?.id as string | undefined;

        if (incidentId && photos.length > 0) {
          for (const photo of photos) {
            try {
              const path = await uploadAttachmentToSupabase(photo, projectId, 'incident');
              const { data: doc, error: docError } = await supabase
                .from('documents')
                .insert({
                  project_id: projectId,
                  title: `INC-${incidentId} :: ${photo.name}`,
                  category: 'incident_attachment',
                })
                .select('id')
                .single();
              if (docError || !doc) continue;

              await supabase.from('document_versions').insert({
                document_id: doc.id,
                file_url: path,
                is_bpe: false,
                version_label: 'v1',
              });
            } catch {
              // Le formulaire reste valide même si une photo échoue à l'envoi.
            }
          }
        }

        setTitle('');
        setDescription('');
        setSeverity('medium');
        setPhotos([]);
        onSuccess?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={fieldClassName}
          placeholder="Décrire l'incident en quelques mots"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={areaClassName}
          placeholder="Détails supplémentaires (optionnel)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sévérité</label>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
          className={selectClassName}
        >
          <option value="low">Faible</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
          <option value="critical">Critique</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Photos incident</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setPhotos((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
          className={`${fieldClassName} mb-2`}
        />
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setPhotos((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
          className={fieldClassName}
        />
        {photos.length > 0 ? (
          <p className="text-xs text-gray-500 mt-1">{photos.length} photo(s) seront jointes a l'incident (capture et galerie cumulees)</p>
        ) : null}
      </div>

      {isError && (
        <p className="text-red-600 text-sm">Erreur lors de la création. Réessayez.</p>
      )}

      <button
        type="submit"
        disabled={isPending || !title.trim()}
        className="w-full bf-primary-btn disabled:opacity-50 py-2 px-4 rounded-lg text-sm"
      >
        {isPending ? 'Création...' : 'Signaler l\'incident'}
      </button>
    </form>
  );
};
