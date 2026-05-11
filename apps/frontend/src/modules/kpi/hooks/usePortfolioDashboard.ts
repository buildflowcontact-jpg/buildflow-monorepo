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
  plannedEndDate: string | null;
}

export interface WorkloadMember {
  workerId: string;
  estimatedHours: number;
  actualHours: number;
}

export interface PortfolioDashboardData {
  revenueInFlight: number;
  estimatedMargin: number;
  delayedProjects: number;
  criticalIncidents: number;
  teamWorkload: number;
  projects: PortfolioProjectSummary[];
  // Nouveaux KPIs
  totalBudgetSold: number;
  totalBudgetSpent: number;
  openIncidents: number;
  lateOrdersToPend: number;
  lateDeliveries: number;
  workloadByMember: WorkloadMember[];
}

export function usePortfolioDashboard() {
  const { data: projects = [] } = useProjects();
  const projectIds = projects.map((project) => project.id);

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio-dashboard', ...projectIds],
    enabled: projectIds.length > 0,
    queryFn: async (): Promise<PortfolioDashboardData> => {
      const [projectsRes, incidentsRes, budgetsRes, invoicesRes, tasksRes, timeRes, ordersRes, deliveriesRes] = await Promise.all([
        supabase.from('projects').select('*').in('id', projectIds),
        supabase.from('incidents').select('id, project_id, severity, status').in('project_id', projectIds),
        supabase.from('budgets').select('project_id, amount_ht, spent_amount').in('project_id', projectIds),
        supabase.from('invoices').select('project_id, amount_ht, status').in('project_id', projectIds),
        supabase.from('tasks').select('*').in('project_id', projectIds),
        supabase.from('time_entries').select('project_id, worker_id, hours').in('project_id', projectIds),
        supabase.from('purchase_orders').select('id, project_id, status, expected_delivery_at').in('project_id', projectIds),
        supabase.from('deliveries').select('order_id, delivered_at').not('order_id', 'is', null),
      ]);

      const errors = [projectsRes.error, incidentsRes.error, budgetsRes.error, invoicesRes.error, tasksRes.error, timeRes.error, ordersRes.error, deliveriesRes.error].filter(Boolean);
      if (errors.length > 0) throw errors[0];

      const projectRows = (projectsRes.data ?? []) as Array<{
        id: string;
        name: string;
        code: string;
        status: string | null;
        completion_pct: number | null;
        planned_end_date?: string | null;
      }>;
      const incidents = incidentsRes.data ?? [];
      const budgets = budgetsRes.data ?? [];
      const invoices = invoicesRes.data ?? [];
      const tasks = (tasksRes.data ?? []) as Array<{
        assigned_to: string | null;
        estimated_hours?: number | null;
      }>;
      const timeEntries = timeRes.data ?? [];
      const orders = ordersRes.data ?? [];
      const deliveries = deliveriesRes.data ?? [];

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
          status: project.status ?? 'draft',
          completionPct: project.completion_pct ?? 0,
          budgetRate,
          incidentCount: projectIncidents.length,
          openCriticalIncidents,
          delayedLabel: budgetRate >= 100 ? 'critique' : budgetRate >= 80 ? 'derive' : 'ok',
          plannedEndDate: project.planned_end_date ?? null,
        } satisfies PortfolioProjectSummary;
      });

      const revenueInFlight = invoices
        .filter((invoice) => invoice.status !== 'paid')
        .reduce((sum, invoice) => sum + (invoice.amount_ht ?? 0), 0);
      const totalBudgetSold = budgets.reduce((sum, b) => sum + (b.amount_ht ?? 0), 0);
      const totalBudgetSpent = budgets.reduce((sum, b) => sum + (b.spent_amount ?? 0), 0);
      const criticalIncidents = incidents.filter((i) => (i.severity === 'critical' || i.severity === 'high') && i.status !== 'closed').length;
      const openIncidents = incidents.filter((i) => i.status !== 'closed' && i.status !== 'resolved').length;
      const delayedProjects = projectSummaries.filter((p) => p.delayedLabel !== 'ok').length;
      const teamWorkload = Math.round(timeEntries.reduce((sum, e) => sum + (e.hours ?? 0), 0));

      // Commandes en retard à recevoir (pas encore livrées, date dépassée)
      const today = new Date().toISOString().split('T')[0];
      const lateOrdersToPend = orders.filter(
        (o) => o.status !== 'delivered' && o.expected_delivery_at && o.expected_delivery_at < today
      ).length;

      // Commandes livrées en retard (delivered_at > expected_delivery_at de la commande)
      const ordersById = Object.fromEntries(orders.map((o) => [o.id, o]));
      const lateDeliveries = deliveries.filter((d) => {
        const order = ordersById[d.order_id ?? ''];
        return order?.expected_delivery_at && d.delivered_at && d.delivered_at > order.expected_delivery_at;
      }).length;

      // Charge par membre : estimée (tasks.estimated_hours) vs réalisée (time_entries.hours)
      const estimatedByMember: Record<string, number> = {};
      const actualByMember: Record<string, number> = {};
      tasks.forEach((t) => {
        if (t.assigned_to) estimatedByMember[t.assigned_to] = (estimatedByMember[t.assigned_to] ?? 0) + (t.estimated_hours ?? 0);
      });
      timeEntries.forEach((e) => {
        if (e.worker_id) actualByMember[e.worker_id] = (actualByMember[e.worker_id] ?? 0) + (e.hours ?? 0);
      });
      const allWorkerIds = new Set([...Object.keys(estimatedByMember), ...Object.keys(actualByMember)]);
      const workloadByMember = Array.from(allWorkerIds).map((workerId) => ({
        workerId,
        estimatedHours: estimatedByMember[workerId] ?? 0,
        actualHours: actualByMember[workerId] ?? 0,
      }));

      return {
        revenueInFlight,
        estimatedMargin: totalBudgetSold - totalBudgetSpent,
        delayedProjects,
        criticalIncidents,
        teamWorkload,
        projects: projectSummaries,
        totalBudgetSold,
        totalBudgetSpent,
        openIncidents,
        lateOrdersToPend,
        lateDeliveries,
        workloadByMember,
      };
    },
  });

  return useMemo(() => ({ data, isLoading }), [data, isLoading]);
}
