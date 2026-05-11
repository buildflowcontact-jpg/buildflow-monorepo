import React from 'react';
import { Button } from '@/components/ui/button';
import { PiloterDashboard } from './PiloterDashboard';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export function Piloter({ projectName }: { projectName?: string }) {
  return (
    <ModuleLayout
      title="Taches"
      description="Priorisez, suivez et clôturez les taches opérationnelles du chantier."
      left={
        <>
          <h3 className="bf-text-primary font-black tracking-tight">Contexte taches</h3>
          <p className="text-sm bf-text-muted">{projectName ?? 'Projet actif'}</p>
          <div className="rounded-xl border border-slate-200 p-3 text-xs bf-text-muted space-y-1">
            <p>Triez d'abord les taches bloquantes puis les taches à échéance courte.</p>
            <p>Le suivi de progression est synchronisé en temps réel avec l'équipe.</p>
          </div>
        </>
      }
      right={
        <>
          <h3 className="bf-text-primary font-black tracking-tight">Actions rapides</h3>
          <Button type="button" variant="ghost" size="sm" className="w-full justify-start">Créer une tache</Button>
          <Button type="button" variant="ghost" size="sm" className="w-full justify-start">Réassigner une priorité</Button>
          <Button type="button" size="sm" className="w-full justify-start">Clôturer les taches du jour</Button>
          <p className="text-xs bf-text-muted">Concentrez-vous sur 3 actions pour garder le flux clair.</p>
        </>
      }
    >
      <PiloterDashboard projectName={projectName} />
    </ModuleLayout>
  );
}
