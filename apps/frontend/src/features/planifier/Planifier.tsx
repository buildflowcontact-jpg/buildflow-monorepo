import React, { useState } from 'react';
import { Gantt, type GanttMode } from './Gantt';
import { Button } from '@/components/ui/button';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export function Planifier() {
  const [mode, setMode] = useState<GanttMode>('normal');

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
          <Button type="button" variant="ghost" size="sm" className="w-full justify-start">Ajouter tache</Button>
          <Button type="button" variant="ghost" size="sm" className="w-full justify-start">Ajouter sous-tache</Button>
          <Button type="button" size="sm" className="w-full justify-start">Assigner equipe</Button>
          <p className="text-xs bf-text-muted">Maximum 3 actions principales pour garder une execution rapide.</p>
        </>
      }
    >
      <div className="bf-card-soft p-4 md:p-5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="bf-text-primary font-black tracking-tight">Workspace Gantt</h3>
          <span className="text-xs bf-text-muted">Mode: {mode === 'normal' ? 'normal' : 'simplifie'}</span>
        </div>
        <Gantt mode={mode} />
      </div>
    </ModuleLayout>
  );
}
