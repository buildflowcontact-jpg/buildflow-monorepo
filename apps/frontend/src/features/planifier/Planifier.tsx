import React, { useState } from 'react';
import { Gantt, type GanttMode, type ResourceConflict } from './Gantt';
import { Button } from '@/components/ui/button';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { downloadCsv, downloadExcel, openPrintPreview } from '@/lib/export';

export function Planifier() {
  const [mode, setMode] = useState<GanttMode>('normal');
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([]);

  const exportRows: Array<Array<string | number>> = [
    ['Type', 'Valeur'],
    ['Mode Gantt', mode],
    ['Conflits ressources', conflicts.length],
    ['Genere le', new Date().toLocaleString('fr-FR')],
    ...conflicts.map((conflict) => [
      'Conflit',
      `${conflict.assignee} | ${conflict.taskA} <-> ${conflict.taskB} | ${conflict.overlapStart} -> ${conflict.overlapEnd}`,
    ]),
  ];

  const handleCsvExport = () => {
    downloadCsv('buildflow-planning.csv', exportRows);
  };

  const handleExcelExport = () => {
    downloadExcel('buildflow-planning.xls', 'Planning', exportRows);
  };

  const handlePdfExport = () => {
    openPrintPreview('Rapport planning BuildFlow', [
      { label: 'Mode', value: mode },
      { label: 'Conflits ressources', value: `${conflicts.length}` },
      { label: 'Date', value: new Date().toLocaleString('fr-FR') },
    ]);
  };

  return (
    <ModuleLayout
      title="Planifier"
      description="Organisez les tâches, dépendances et ressources avec lecture gauche vers action droite."
      left={
        <>
          <h3 className="bf-text-primary font-black tracking-tight">Navigation planning</h3>
          <div className="space-y-2">
            <Button type="button" variant={mode === 'simplifie' ? 'default' : 'ghost'} size="sm" onClick={() => setMode('simplifie')} className="w-full justify-start">
              Vue Gantt simplifie
            </Button>
            <Button type="button" variant={mode === 'normal' ? 'default' : 'ghost'} size="sm" onClick={() => setMode('normal')} className="w-full justify-start">
              Vue Gantt normale
            </Button>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 text-xs bf-text-muted space-y-1">
            <p>1. Creez une tache principale</p>
            <p>2. Ajoutez des sous-taches</p>
            <p>3. Affectez les equipes</p>
          </div>
        </>
      }
      right={
        <>
          <h3 className="bf-text-primary font-black tracking-tight">Actions rapides</h3>
          <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={handleCsvExport}>Exporter CSV</Button>
          <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={handleExcelExport}>Exporter Excel</Button>
          <Button type="button" size="sm" className="w-full justify-start" onClick={handlePdfExport}>Exporter PDF</Button>
          <p className="text-xs bf-text-muted">Visualisation planning + exports de pilotage documentaire.</p>
        </>
      }
    >
      {conflicts.length > 0 ? (
        <div className="bf-card-soft p-4 mb-3 border border-amber-200">
          <h3 className="bf-text-primary font-black tracking-tight mb-2">Conflits de ressources détectés</h3>
          <div className="space-y-1 text-sm">
            {conflicts.slice(0, 6).map((conflict, index) => (
              <p key={`${conflict.assignee}-${index}`} className="text-amber-700">
                {conflict.assignee}: {conflict.taskA} ↔ {conflict.taskB} ({conflict.overlapStart} - {conflict.overlapEnd})
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="bf-card-soft p-4 md:p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="bf-text-primary font-black tracking-tight">Workspace Gantt</h3>
          <span className="text-xs bf-text-muted">Mode: {mode === 'normal' ? 'normal' : 'simplifie'}</span>
        </div>
        <Gantt mode={mode} onConflictsChange={setConflicts} />
      </div>
    </ModuleLayout>
  );
}
