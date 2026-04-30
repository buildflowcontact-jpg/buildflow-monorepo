// Ce fichier sera généré automatiquement par Supabase CLI
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
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          status?: string;
          created_at?: string;
        };
      };
      // ...autres tables à compléter
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
