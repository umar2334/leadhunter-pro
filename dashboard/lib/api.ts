import { createClient } from './supabase';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'https://leadhunter-pro-production.up.railway.app';

export type OpportunityType = 'no_website' | 'weak_website' | 'has_website';
export type LeadStatus = 'new' | 'contacted' | 'replied' | 'converted' | 'dead';

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  category: string | null;
  rating: number | null;
  review_count: number | null;
  opportunity_type: OpportunityType;
  analysis_score: number | null;
  analysis_issues: string[] | null;
  analysis_summary: string | null;
  maps_url: string | null;
  whatsapp_number: string | null;
  website_phone: string | null;
  owner_name: string | null;
  follow_up_date: string | null;
  status: LeadStatus;
  notes: string | null;
  outreach_sent: boolean;
  created_at: string;
}

export interface Stats {
  total: number;
  no_website: number;
  weak_website: number;
  has_website: number;
  new: number;
  contacted: number;
  converted: number;
}

export interface OutreachMessages {
  email: { subject: string; body: string };
  whatsapp: string;
  call_script: string;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {}
  return {};
}

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader, ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const leadsApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api<{ leads: Lead[]; total: number }>(`/leads${qs ? '?' + qs : ''}`);
  },
  get: (id: string) => api<Lead>(`/leads/${id}`),
  update: (id: string, body: Partial<Pick<Lead, 'status' | 'notes' | 'outreach_sent' | 'follow_up_date' | 'owner_name'>>) =>
    api<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => api<{ success: boolean }>(`/leads/${id}`, { method: 'DELETE' }),
  stats: () => api<Stats>('/leads/stats'),
  outreach: (id: string) => api<OutreachMessages>(`/leads/${id}/outreach`, { method: 'POST' }),
  analyze: (url: string) => api<any>('/analyze', { method: 'POST', body: JSON.stringify({ url }) }),
  exportCsvUrl: () => `${BASE}/leads/export.csv`,
  exportXlsxUrl: () => `${BASE}/leads/export.xlsx`,
  analytics: () => api<any>('/leads/analytics'),
};
