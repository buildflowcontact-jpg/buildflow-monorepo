import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type BudgetRow = Database['public']['Tables']['budgets']['Row'];
export type InvoiceRow = Database['public']['Tables']['invoices']['Row'];
export type ExpenseRow = Database['public']['Tables']['expenses']['Row'];

export function useBudgets(projectId: string) {
  return useQuery({
    queryKey: ['budgets', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('project_id', projectId)
        .order('category');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBudget(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ category, amount_ht }: { category: string; amount_ht: number }) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert({ project_id: projectId, category, amount_ht })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', projectId] });
    },
  });
}

export function useUpdateBudget(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount_ht }: { id: string; amount_ht: number }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update({ amount_ht })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', projectId] });
    },
  });
}

export function useInvoices(projectId: string) {
  return useQuery({
    queryKey: ['invoices', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', projectId)
        .order('invoice_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInvoice(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reference,
      supplier_id,
      amount_ht,
      amount_ttc,
      invoice_date,
      due_date,
      notes,
    }: {
      reference: string;
      supplier_id?: string | null;
      amount_ht?: number | null;
      amount_ttc?: number | null;
      invoice_date?: string | null;
      due_date?: string | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          project_id: projectId,
          reference,
          supplier_id: supplier_id ?? null,
          amount_ht: amount_ht ?? null,
          amount_ttc: amount_ttc ?? null,
          invoice_date: invoice_date ?? null,
          due_date: due_date ?? null,
          status: 'pending',
          notes: notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', projectId] });
    },
  });
}

export function useUpdateInvoiceStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', projectId] });
    },
  });
}

export function useExpenses(projectId: string) {
  return useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateExpense(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      category,
      description,
      amount_ht,
      amount_ttc,
      expense_date,
    }: {
      category: string;
      description: string;
      amount_ht: number;
      amount_ttc?: number | null;
      expense_date: string;
    }) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          project_id: projectId,
          category,
          description,
          amount_ht,
          amount_ttc: amount_ttc ?? null,
          expense_date,
          status: 'recorded',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', projectId] });
    },
  });
}
