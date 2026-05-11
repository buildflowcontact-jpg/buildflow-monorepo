import React from 'react';
import { DocumentList } from '@/modules/bureau-etudes/components/DocumentList';
import { PlanViewer } from '@/features/planviewer/PlanViewer';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

interface ExecutePageProps {
  projectId: string;
  activeDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
}

export function ExecutePage({ projectId, activeDocumentId, onSelectDocument }: ExecutePageProps) {
  return (
    <ModuleLayout
      left={
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="bf-text-primary font-black tracking-tight">Documents</h3>
          </div>
          <DocumentList projectId={projectId} onSelect={onSelectDocument} />
        </>
      }
      right={
        <>
          <h3 className="bf-text-primary font-black tracking-tight mb-3">Gestion documentaire</h3>
          <div className="bf-card-soft p-4 mt-2 space-y-2 text-sm bf-text-muted">
            <p>1. Déposez vos documents et versions.</p>
            <p>2. Recherchez un document via la barre de recherche.</p>
            <p>3. Ouvrez le document dans le viewer central.</p>
            <p>4. Gérez les signatures électroniques depuis la liste.</p>
          </div>
        </>
      }
      rightClassName="space-y-2"
    >
      <div className="bf-card-soft p-4 min-h-[460px]">
        <h3 className="bf-text-primary font-black tracking-tight mb-3">Viewer</h3>
        {activeDocumentId ? (
          <PlanViewer projectId={projectId} documentId={activeDocumentId} />
        ) : (
          <div className="h-[360px] rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-sm bf-text-muted">
            Sélectionnez un document pour afficher le plan.
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
