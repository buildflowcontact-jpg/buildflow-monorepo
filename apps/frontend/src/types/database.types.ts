export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          code: string;
          status: string;
          completion_pct: number | null;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          status?: string;
          completion_pct?: number | null;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          status?: string;
          completion_pct?: number | null;
          owner_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          category: string | null;
          doc_type: string | null;
          is_bpe: boolean | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          category?: string | null;
          doc_type?: string | null;
          is_bpe?: boolean | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          category?: string | null;
          doc_type?: string | null;
          is_bpe?: boolean | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      document_versions: {
        Row: {
          id: string;
          document_id: string;
          file_url: string;
          is_bpe: boolean | null;
          version_label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          file_url: string;
          is_bpe?: boolean | null;
          version_label?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          file_url?: string;
          is_bpe?: boolean | null;
          version_label?: string | null;
        };
        Relationships: [];
      };
      project_events: {
        Row: {
          id: string;
          project_id: string;
          event_type: string;
          event_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          event_type: string;
          event_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          event_type?: string;
          event_data?: Json | null;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          contact_email: string | null;
          contact_phone: string | null;
          company: string | null;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          company?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          company?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
      sales_leads: {
        Row: {
          id: string;
          project_id: string;
          client_id: string | null;
          description: string | null;
          status: string | null;
          value_ht: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          client_id?: string | null;
          description?: string | null;
          status?: string | null;
          value_ht?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          client_id?: string | null;
          description?: string | null;
          status?: string | null;
          value_ht?: number | null;
        };
        Relationships: [];
      };
      sales_pipeline: {
        Row: {
          id: string;
          project_id: string;
          stage: string;
          total_value: number | null;
          count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage: string;
          total_value?: number | null;
          count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          stage?: string;
          total_value?: number | null;
          count?: number | null;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          project_id: string;
          category: string;
          amount_ht: number;
          spent_amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          category: string;
          amount_ht: number;
          spent_amount?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          category?: string;
          amount_ht?: number;
          spent_amount?: number | null;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          project_id: string;
          reference: string;
          supplier_id: string | null;
          amount_ht: number | null;
          amount_ttc: number | null;
          invoice_date: string | null;
          due_date: string | null;
          status: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          reference: string;
          supplier_id?: string | null;
          amount_ht?: number | null;
          amount_ttc?: number | null;
          invoice_date?: string | null;
          due_date?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          reference?: string;
          supplier_id?: string | null;
          amount_ht?: number | null;
          amount_ttc?: number | null;
          invoice_date?: string | null;
          due_date?: string | null;
          status?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          project_id: string;
          category: string;
          description: string;
          amount_ht: number;
          amount_ttc: number | null;
          expense_date: string;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          category: string;
          description: string;
          amount_ht: number;
          amount_ttc?: number | null;
          expense_date: string;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          category?: string;
          description?: string;
          amount_ht?: number;
          amount_ttc?: number | null;
          expense_date?: string;
          status?: string | null;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          type?: string | null;
        };
        Relationships: [];
      };
      purchase_orders: {
        Row: {
          id: string;
          project_id: string;
          reference: string;
          supplier_id: string | null;
          status: string | null;
          total_ht: number | null;
          ordered_at: string | null;
          expected_delivery_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          reference: string;
          supplier_id?: string | null;
          status?: string | null;
          total_ht?: number | null;
          ordered_at?: string | null;
          expected_delivery_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          reference?: string;
          supplier_id?: string | null;
          status?: string | null;
          total_ht?: number | null;
          ordered_at?: string | null;
          expected_delivery_at?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      deliveries: {
        Row: {
          id: string;
          project_id: string;
          order_id: string | null;
          supplier_id: string | null;
          delivered_at: string;
          status: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          order_id?: string | null;
          supplier_id?: string | null;
          delivered_at: string;
          status?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          order_id?: string | null;
          supplier_id?: string | null;
          delivered_at?: string;
          status?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          project_id: string;
          type: string;
          target_role: string | null;
          reference_id: string | null;
          is_read: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          type: string;
          target_role?: string | null;
          reference_id?: string | null;
          is_read?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          type?: string;
          target_role?: string | null;
          reference_id?: string | null;
          is_read?: boolean | null;
        };
        Relationships: [];
      };
      time_entries: {
        Row: {
          id: string;
          project_id: string;
          worker_id: string | null;
          task_id: string | null;
          hours: number;
          description: string | null;
          work_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          worker_id?: string | null;
          task_id?: string | null;
          hours: number;
          description?: string | null;
          work_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          worker_id?: string | null;
          task_id?: string | null;
          hours?: number;
          description?: string | null;
          work_date?: string;
        };
        Relationships: [];
      };
      workers: {
        Row: {
          id: string;
          project_id: string;
          full_name: string;
          role: string | null;
          company: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          full_name: string;
          role?: string | null;
          company?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          full_name?: string;
          role?: string | null;
          company?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          id: string;
          role_id: string;
          permission: string;
          granted_at: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          permission: string;
          granted_at?: string;
        };
        Update: {
          id?: string;
          role_id?: string;
          permission?: string;
        };
        Relationships: [];
      };
      security_logs: {
        Row: {
          id: string;
          project_id: string;
          actor_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          actor_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          actor_id?: string | null;
          action?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          details?: Json | null;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: string | null;
          priority: string | null;
          assigned_to: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          assigned_to?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          assigned_to?: string | null;
          due_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      incidents: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          severity: string | null;
          status: string | null;
          reported_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          severity?: string | null;
          status?: string | null;
          reported_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          severity?: string | null;
          status?: string | null;
          reported_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          event_id: string | null;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          project_id: string | null;
          metadata: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          project_id?: string | null;
          metadata?: Record<string, unknown> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          metadata?: Record<string, unknown> | null;
        };
        Relationships: [];
      };
      workflows: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          entity_type: string;
          trigger_event: string;
          conditions: Record<string, unknown> | null;
          actions: Record<string, unknown>[];
          active: boolean;
          max_depth: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          entity_type: string;
          trigger_event: string;
          conditions?: Record<string, unknown> | null;
          actions?: Record<string, unknown>[];
          active?: boolean;
          max_depth?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          entity_type?: string;
          trigger_event?: string;
          conditions?: Record<string, unknown> | null;
          actions?: Record<string, unknown>[];
          active?: boolean;
          max_depth?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      project_role: {
        Args: { p_project_id: string };
        Returns: string;
      };
      user_projects: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          name: string;
          code: string;
          status: string;
          role: string;
        }>;
      };
      add_project_member: {
        Args: { p_project_id: string; p_user_id: string; p_role?: string };
        Returns: boolean;
      };
      update_project_member_role: {
        Args: { p_project_id: string; p_user_id: string; p_role: string };
        Returns: boolean;
      };
      remove_project_member: {
        Args: { p_project_id: string; p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
