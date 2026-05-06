// modules/terrain/hooks/useTerrain.ts
// Agrège les données critiques du terrain : incidents ouverts, tâches actives, livraisons en retard.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import type { TerrainAlert, TerrainTask, TerrainFeedItem, TerrainStats } from '../types';
import { isOverdue, timeAgo } from '@/utils/date';

export function useTerrain(projectId: string) {
  return useQuery({
    queryKey: ['terrain', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // Requêtes parallèles
      const [incidentsRes, tasksRes, ordersRes, eventsRes] = await Promise.all([
        supabase
          .from('incidents')
          .select('id, title, severity, status, created_at')
          .eq('project_id', projectId)
          .not('status', 'in', '("resolved","rejected")')
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('tasks')
          .select('id, title, status, priority')
          .eq('project_id', projectId)
          .in('status', ['todo', 'in_progress'])
          .order('created_at', { ascending: true })
          .limit(3),

        supabase
          .from('purchase_orders')
          .select('id, reference, expected_delivery_at, status')
          .eq('project_id', projectId)
          .not('status', 'in', '("delivered","cancelled")')
          .limit(20),

        supabase
          .from('project_events')
          .select('id, event_type, event_data, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      // Alertes critiques
      const alerts: TerrainAlert[] = [];

      (incidentsRes.data ?? [])
        .filter((i) => i.severity === 'critical' || i.severity === 'high')
        .forEach((i) =>
          alerts.push({
            id: i.id,
            label: i.title,
            type: i.severity === 'critical' ? 'danger' : 'warning',
            source: 'incident',
          })
        );

      (ordersRes.data ?? [])
        .filter((o) => o.expected_delivery_at && isOverdue(o.expected_delivery_at))
        .forEach((o) =>
          alerts.push({
            id: o.id,
            label: `Commande en retard : ${o.reference}`,
            type: 'warning',
            source: 'delivery',
          })
        );

      // Tâches actives (max 3)
      const tasks: TerrainTask[] = (tasksRes.data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status ?? 'todo',
        priority: t.priority ?? null,
      }));

      // Live feed depuis project_events (event_type + event_data)
      const eventIconMap: Record<string, string> = {
        INCIDENT: '🔴',
        VALIDATION: '✔',
        PLAN_CHANGE: '📋',
        DELIVERY: '📦',
        COMMENT: '💬',
      };

      const feed: TerrainFeedItem[] = (eventsRes.data ?? []).map((e) => {
        const data = e.event_data as Record<string, unknown> | null;
        const label = (data?.['description'] as string) ?? e.event_type;
        return {
          id: e.id,
          icon: eventIconMap[e.event_type] ?? '•',
          label,
          time: timeAgo(e.created_at),
        };
      });

      // Stats pour la StatusBar
      const lateOrders = (ordersRes.data ?? []).filter(
        (o) => o.expected_delivery_at && isOverdue(o.expected_delivery_at)
      );

      const stats: TerrainStats = {
        incidentCount: incidentsRes.data?.length ?? 0,
        lateDeliveryCount: lateOrders.length,
        progressPercent: 0,
      };

      return { alerts, tasks, feed, stats };
    },
    enabled: !!projectId,
    refetchInterval: 30_000, // Rafraîchissement auto toutes les 30s
  });
}
