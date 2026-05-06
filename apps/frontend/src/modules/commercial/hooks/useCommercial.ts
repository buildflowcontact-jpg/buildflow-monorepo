import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type SalesLeadRow = Database['public']['Tables']['sales_leads']['Row'];
type SalesPipelineRow = Database['public']['Tables']['sales_pipeline']['Row'];

// Clients Hooks
export function useClients(projectId: string) {
  return useQuery({
    queryKey: ['clients', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, contact_email, contact_phone, company, status, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ClientRow[];
    },
    enabled: !!projectId,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      name: string;
      contactEmail?: string;
      contactPhone?: string;
      company?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          project_id: params.projectId,
          name: params.name,
          contact_email: params.contactEmail,
          contact_phone: params.contactPhone,
          company: params.company,
          status: params.status || 'prospect',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as ClientRow;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['clients', projectId] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      clientId: string;
      projectId: string;
      name?: string;
      contactEmail?: string;
      contactPhone?: string;
      company?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: params.name,
          contact_email: params.contactEmail,
          contact_phone: params.contactPhone,
          company: params.company,
          status: params.status,
        })
        .eq('id', params.clientId)
        .select()
        .single();
      
      if (error) throw error;
      return data as ClientRow;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['clients', projectId] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { clientId: string; projectId: string }) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', params.clientId);
      
      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['clients', projectId] });
    },
  });
}

// Sales Leads Hooks
export function useSalesLeads(projectId: string) {
  return useQuery({
    queryKey: ['sales_leads', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_leads')
        .select('id, client_id, description, status, value_ht, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SalesLeadRow[];
    },
    enabled: !!projectId,
  });
}

export function useCreateSalesLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      clientId?: string;
      description?: string;
      status?: string;
      valueHt?: number;
    }) => {
      const { data, error } = await supabase
        .from('sales_leads')
        .insert({
          project_id: params.projectId,
          client_id: params.clientId,
          description: params.description,
          status: params.status || 'new',
          value_ht: params.valueHt,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as SalesLeadRow;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['sales_leads', projectId] });
    },
  });
}

export function useUpdateSalesLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      leadId: string;
      projectId: string;
      status?: string;
      description?: string;
      valueHt?: number;
    }) => {
      const { data, error } = await supabase
        .from('sales_leads')
        .update({
          status: params.status,
          description: params.description,
          value_ht: params.valueHt,
        })
        .eq('id', params.leadId)
        .select()
        .single();
      
      if (error) throw error;
      return data as SalesLeadRow;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['sales_leads', projectId] });
    },
  });
}

export function useDeleteSalesLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { leadId: string; projectId: string }) => {
      const { error } = await supabase
        .from('sales_leads')
        .delete()
        .eq('id', params.leadId);
      
      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['sales_leads', projectId] });
    },
  });
}

// Sales Pipeline Hooks
export function useSalesPipeline(projectId: string) {
  return useQuery({
    queryKey: ['sales_pipeline', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_pipeline')
        .select('id, stage, total_value, count, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SalesPipelineRow[];
    },
    enabled: !!projectId,
  });
}
