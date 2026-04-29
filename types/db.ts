// types/db.ts
export type Project = {
  id: string;
  name: string;
  code_budget?: string;
  status: 'active' | 'archived' | 'lead';
  created_at: string;
};

export type Document = {
  id: string;
  project_id: string;
  title: string;
  category: string;
};

export type DocumentVersion = {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  status: 'draft' | 'review' | 'approved' | 'rejected';
  is_bpe: boolean;
  created_by: string;
  validated_by?: string;
  created_at: string;
};

export type ProjectEvent = {
  id: string;
  project_id: string;
  author_id: string;
  type: string;
  description?: string;
  location_id?: string;
  linked_bpe_id?: string;
  metadata: any;
  created_at: string;
};
