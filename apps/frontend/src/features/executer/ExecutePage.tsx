import React from 'react';
import { DocumentList } from '@/modules/bureau-etudes/components/DocumentList';
import { EventList } from '@/features/events/EventList';
import { PlanViewer } from '@/features/planviewer/PlanViewer';
import QuickActionPro from '@/QuickActionPro';
import { Button } from '@/components/ui/button';
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
          <h3 className="bf-text-primary font-black tracking-tight mb-3">Actions rapides</h3>
          <div className="grid grid-cols-1 gap-2 mb-3">
            <Button type="button" variant="ghost" className="justify-start">Photo incident</Button>
            <Button type="button" variant="ghost" className="justify-start">Signaler incident</Button>
            <Button type="button" variant="ghost" className="justify-start">Tache terminee</Button>
          </div>
          <QuickActionPro projectId={projectId} activeDocumentId={activeDocumentId ?? undefined} />
          <div className="bf-card-soft p-4 mt-2">
            <h3 className="bf-text-primary font-black tracking-tight mb-3">Activite live</h3>
            <div className="max-h-[320px] overflow-auto">
              <EventList projectId={projectId} />
            </div>
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
