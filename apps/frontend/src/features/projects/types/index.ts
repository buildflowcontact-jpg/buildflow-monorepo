export type ProjectStatus = 'PROSPECTION' | 'PLANIFICATION' | 'EN_COURS' | 'LIVRAISON' | 'CLOTURE';
export type TaskStatus = 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'BLOQUE';

export interface Project {
  id: string;
  name: string;
  address?: string;
  client_id?: string;
  status: ProjectStatus;
  budget_global?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  name: string;
  order_index: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface Task {
  id: string;
  phase_id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: number;
  estimated_duration?: number;
  actual_duration?: number;
  start_date?: string;
  end_date?: string;
  dependency_id?: string;
  created_at: string;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  user_id: string;
  role_on_project?: string;
  assigned_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role_id: string;
  phone?: string;
  email?: string;
  hourly_rate?: number;
}