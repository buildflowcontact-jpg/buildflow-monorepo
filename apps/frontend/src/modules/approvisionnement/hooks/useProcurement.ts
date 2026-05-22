import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type PurchaseOrderRow = Database['public']['Tables']['purchase_orders']['Row'];
export type DeliveryRow = Database['public']['Tables']['deliveries']['Row'];

export function usePurchaseOrders(projectId: string) {
  return useQuery({
    queryKey: ['purchase-orders', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePurchaseOrder(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reference,
      supplier_id,
      total_ht,
      ordered_at,
      expected_delivery_at,
      notes,
    }: {
      reference: string;
      supplier_id?: string | null;
      total_ht?: number | null;
      ordered_at?: string | null;
      expected_delivery_at?: string | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert({
          project_id: projectId,
          reference,
          status: 'draft',
          supplier_id: supplier_id ?? null,
          total_ht: total_ht ?? null,
          ordered_at: ordered_at ?? null,
          expected_delivery_at: expected_delivery_at ?? null,
          notes: notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', projectId] });
    },
  });
}

export function useUpdatePurchaseOrderStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', projectId] });
    },
  });
}

export function useDeliveries(projectId: string) {
  return useQuery({
    queryKey: ['deliveries', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('project_id', projectId)
        .order('delivered_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDelivery(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      order_id,
      supplier_id,
      delivered_at,
      status,
      notes,
      markOrderDelivered,
    }: {
      order_id?: string | null;
      supplier_id?: string | null;
      delivered_at: string;
      status?: string | null;
      notes?: string | null;
      markOrderDelivered?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          project_id: projectId,
          order_id: order_id ?? null,
          supplier_id: supplier_id ?? null,
          delivered_at,
          status: status ?? 'received',
          notes: notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      // Une livraison reliée à une commande fait évoluer la commande vers "delivered".
      if (order_id && markOrderDelivered !== false) {
        await supabase
          .from('purchase_orders')
          .update({ status: 'delivered' })
          .eq('id', order_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', projectId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', projectId] });
    },
  });
}

export function useUpdatePurchaseOrder(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      reference,
      supplier_id,
      total_ht,
      ordered_at,
      expected_delivery_at,
      notes,
    }: {
      id: string;
      reference?: string;
      supplier_id?: string | null;
      total_ht?: number | null;
      ordered_at?: string | null;
      expected_delivery_at?: string | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          ...(reference !== undefined ? { reference } : {}),
          ...(supplier_id !== undefined ? { supplier_id } : {}),
          ...(total_ht !== undefined ? { total_ht } : {}),
          ...(ordered_at !== undefined ? { ordered_at } : {}),
          ...(expected_delivery_at !== undefined ? { expected_delivery_at } : {}),
          ...(notes !== undefined ? { notes } : {}),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', projectId] });
    },
  });
}

export function useUpdateDelivery(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      delivered_at,
      status,
      notes,
    }: {
      id: string;
      delivered_at?: string;
      status?: string;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('deliveries')
        .update({
          ...(delivered_at !== undefined ? { delivered_at } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(notes !== undefined ? { notes } : {}),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', projectId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', projectId] });
    },
  });
}
