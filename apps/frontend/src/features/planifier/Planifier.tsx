import React, { useState } from 'react';
import { Gantt, type GanttMode, type ResourceConflict } from './Gantt';
import { Button } from '@/components/ui/button';
import { downloadCsv, downloadExcel, openPrintPreview } from '@/lib/export';

export function Planifier() {
  const [mode, setMode] = useState<GanttMode>('normal');
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="bf-text-primary font-black text-2xl mb-1">Planning</h2>
          <p className="bf-text-muted">Visualisation du diagramme de Gantt interactif.</p>
        </div>
        <div className="relative">
          <Button type="button" onClick={() => setIsExportMenuOpen((v) => !v)}>Exporter</Button>
          {isExportMenuOpen ? (
            <div className="absolute right-0 mt-2 z-20 rounded-xl border border-slate-200 bg-white p-2 shadow-lg min-w-[180px]">
              <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => { handleCsvExport(); setIsExportMenuOpen(false); }}>
                Export CSV
              </Button>
              <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => { handleExcelExport(); setIsExportMenuOpen(false); }}>
                Export Excel
              </Button>
              <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => { handlePdfExport(); setIsExportMenuOpen(false); }}>
                Export PDF
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant={mode === 'normal' ? 'default' : 'ghost'} size="sm" onClick={() => setMode('normal')}>
          Vue normale
        </Button>
        <Button type="button" variant={mode === 'simplifie' ? 'default' : 'ghost'} size="sm" onClick={() => setMode('simplifie')}>
          Vue simplifiee
        </Button>
      </div>

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
          <h3 className="bf-text-primary font-black tracking-tight">Diagramme de Gantt</h3>
          <span className="text-xs bf-text-muted">Mode: {mode === 'normal' ? 'normal' : 'simplifie'}</span>
        </div>
        <Gantt mode={mode} onConflictsChange={setConflicts} />
      </div>
    </div>
  );
}
