import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useProjects } from '@/hooks/useProjects';

interface PortfolioProjectSummary {
  id: string;
  name: string;
  code: string;
  status: string;
  completionPct: number;
  budgetRate: number;
  incidentCount: number;
  openCriticalIncidents: number;
  delayedLabel: 'ok' | 'derive' | 'critique';
}

export interface PortfolioDashboardData {
  revenueInFlight: number;
  estimatedMargin: number;
  delayedProjects: number;
  criticalIncidents: number;
  teamWorkload: number;
  projects: PortfolioProjectSummary[];
}

export function usePortfolioDashboard() {
  const { data: projects = [] } = useProjects();
  const projectIds = projects.map((project) => project.id);

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio-dashboard', ...projectIds],
    enabled: projectIds.length > 0,
    queryFn: async (): Promise<PortfolioDashboardData> => {
      const [projectsRes, incidentsRes, budgetsRes, invoicesRes, tasksRes, timeRes] = await Promise.all([
        supabase.from('projects').select('id, name, code, status, completion_pct').in('id', projectIds),
        supabase.from('incidents').select('id, project_id, severity, status').in('project_id', projectIds),
        supabase.from('budgets').select('project_id, amount_ht, spent_amount').in('project_id', projectIds),
        supabase.from('invoices').select('project_id, amount_ht, status').in('project_id', projectIds),
        supabase.from('tasks').select('project_id, assigned_to, status').in('project_id', projectIds),
        supabase.from('time_entries').select('project_id, hours').in('project_id', projectIds),
      ]);

      const errors = [projectsRes.error, incidentsRes.error, budgetsRes.error, invoicesRes.error, tasksRes.error, timeRes.error].filter(Boolean);
      if (errors.length > 0) throw errors[0];

      const projectRows = projectsRes.data ?? [];
      const incidents = incidentsRes.data ?? [];
      const budgets = budgetsRes.data ?? [];
      const invoices = invoicesRes.data ?? [];
      const tasks = tasksRes.data ?? [];
      const timeEntries = timeRes.data ?? [];

      const projectSummaries = projectRows.map((project) => {
        const projectBudgets = budgets.filter((budget) => budget.project_id === project.id);
        const projectIncidents = incidents.filter((incident) => incident.project_id === project.id);
        const totalBudget = projectBudgets.reduce((sum, budget) => sum + (budget.amount_ht ?? 0), 0);
        const spentBudget = projectBudgets.reduce((sum, budget) => sum + (budget.spent_amount ?? 0), 0);
        const budgetRate = totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0;
        const openCriticalIncidents = projectIncidents.filter((incident) => (incident.severity === 'critical' || incident.severity === 'high') && incident.status !== 'closed').length;
        return {
          id: project.id,
          name: project.name,
          code: project.code,
          status: project.status,
          completionPct: project.completion_pct ?? 0,
          budgetRate,
          incidentCount: projectIncidents.length,
          openCriticalIncidents,
          delayedLabel: budgetRate >= 100 ? 'critique' : budgetRate >= 80 ? 'derive' : 'ok',
        } satisfies PortfolioProjectSummary;
      });

      const revenueInFlight = invoices
        .filter((invoice) => invoice.status !== 'paid')
        .reduce((sum, invoice) => sum + (invoice.amount_ht ?? 0), 0);
      const totalBudget = budgets.reduce((sum, budget) => sum + (budget.amount_ht ?? 0), 0);
      const spentBudget = budgets.reduce((sum, budget) => sum + (budget.spent_amount ?? 0), 0);
      const criticalIncidents = incidents.filter((incident) => (incident.severity === 'critical' || incident.severity === 'high') && incident.status !== 'closed').length;
      const delayedProjects = projectSummaries.filter((project) => project.delayedLabel !== 'ok').length;
      const teamWorkload = Math.round(timeEntries.reduce((sum, entry) => sum + (entry.hours ?? 0), 0));

      return {
        revenueInFlight,
        estimatedMargin: totalBudget - spentBudget,
        delayedProjects,
        criticalIncidents,
        teamWorkload,
        projects: projectSummaries,
      };
    },
  });

  return useMemo(() => ({ data, isLoading }), [data, isLoading]);
}
