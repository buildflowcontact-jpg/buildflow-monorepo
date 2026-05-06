import React from 'react';
import { Button } from '@/components/ui/button';
import { PiloterDashboard } from './PiloterDashboard';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

export function Piloter({ projectName }: { projectName?: string }) {
  return (
    <ModuleLayout
      title="Piloter"
      description="Vision globale, alertes et decisions pour le pilotage chantier."
      left={
        <>
          <h3 className="bf-text-primary font-black tracking-tight">Contexte projet</h3>
          <p className="text-sm bf-text-muted">{projectName ?? 'Projet actif'}</p>
          <div className="rounded-xl border border-slate-200 p-3 text-xs bf-text-muted space-y-1">
            <p>Budget, incidents et retards sont priorises.</p>
            <p>Les KPI sont actualises en continu dans le workspace.</p>
          </div>
        </>
      }
      right={
        <>
          <h3 className="bf-text-primary font-black tracking-tight">Actions rapides</h3>
          <Button type="button" variant="ghost" size="sm" className="w-full justify-start">Exporter rapport</Button>
          <Button type="button" variant="ghost" size="sm" className="w-full justify-start">Revue alertes</Button>
          <Button type="button" size="sm" className="w-full justify-start">Plan d'action</Button>
          <p className="text-xs bf-text-muted">3 actions maximum pour decider rapidement.</p>
        </>
      }
    >
      <PiloterDashboard projectName={projectName} />
    </ModuleLayout>
  );
}
