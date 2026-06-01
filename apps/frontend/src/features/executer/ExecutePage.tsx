import React from 'react';
import { FileText, Search, ShieldCheck } from 'lucide-react';
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
          <div className="mb-3 flex items-center justify-between">
            <h3 className="bf-text-primary flex items-center gap-2 font-black tracking-tight">
              <FileText size={16} className="text-blue-600" />
              Documents
            </h3>
          </div>
          <DocumentList projectId={projectId} onSelect={onSelectDocument} />
        </>
      }
      right={
        <>
          <h3 className="bf-text-primary mb-3 font-black tracking-tight">Gestion documentaire</h3>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 text-sm bf-text-muted">
            <div className="flex items-center gap-2 text-slate-700">
              <FileText size={15} className="text-blue-600" />
              <span>Deposez vos documents et versions.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Search size={15} className="text-emerald-600" />
              <span>Recherchez un document via la barre de recherche.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck size={15} className="text-violet-600" />
              <span>Gerez les signatures electroniques depuis la liste.</span>
            </div>
          </div>
        </>
      }
      rightClassName="space-y-2"
    >
      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm min-h-[460px]">
        <h3 className="bf-text-primary mb-3 font-black tracking-tight">Viewer</h3>
        {activeDocumentId ? (
          <PlanViewer projectId={projectId} documentId={activeDocumentId} />
        ) : (
          <div className="h-[360px] rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-sm bf-text-muted bg-slate-50/60">
            Sélectionnez un document pour afficher le plan.
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
