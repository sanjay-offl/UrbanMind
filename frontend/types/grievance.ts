export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type Status = 'pending' | 'classified' | 'in_progress' | 'resolved' | 'closed';

export interface Grievance {
  id: number;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  ward_id: number;
  ward_name: string;
  ward?: string;
  lat: number;
  lng: number;
  status: Status;
  priority: Priority;
  score: number;
  sentiment: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Ward {
  id: number;
  name: string;
}
