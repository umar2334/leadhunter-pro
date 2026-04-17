'use client';
import { Search, X } from 'lucide-react';
import { leadsApi } from '@/lib/api';
import { Download } from 'lucide-react';

interface Filters { opportunity_type: string; status: string; category: string; search: string; }
interface Props { filters: Filters; onChange: (f: Filters) => void; }

const OPP = [
  { value: '', label: 'All Types' },
  { value: 'no_website',   label: '🔥 No Website' },
  { value: 'weak_website', label: '⚠️ Weak Site' },
  { value: 'has_website',  label: '✅ Has Website' },
];
const STATUS = [
  { value: '', label: 'All Statuses' },
  { value: 'new',       label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'replied',   label: 'Replied' },
  { value: 'converted', label: 'Converted' },
  { value: 'dead',      label: 'Dead' },
];

export default function LeadFilters({ filters, onChange }: Props) {
  const set = (k: keyof Filters, v: string) => onChange({ ...filters, [k]: v });
  const hasActive = filters.opportunity_type || filters.status || filters.category || filters.search;

  return (
    <div className="toolbar">
      <div className="toolbar-search">
        <Search size={14} />
        <input placeholder="Search by name or location..."
          value={filters.search} onChange={(e) => set('search', e.target.value)} />
      </div>

      <select className="toolbar-select" value={filters.opportunity_type}
        onChange={(e) => set('opportunity_type', e.target.value)}>
        {OPP.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select className="toolbar-select" value={filters.status}
        onChange={(e) => set('status', e.target.value)}>
        {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <input className="toolbar-input" placeholder="Category..."
        value={filters.category} onChange={(e) => set('category', e.target.value)} />

      {hasActive && (
        <button className="btn-csv" style={{ color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2' }}
          onClick={() => onChange({ opportunity_type: '', status: '', category: '', search: '' })}>
          <X size={12} /> Clear
        </button>
      )}

      <div className="toolbar-divider" />

      <a href={leadsApi.exportXlsxUrl()} download="leads.xlsx" className="btn-excel">
        <Download size={13} /> Excel
      </a>
      <a href={leadsApi.exportCsvUrl()} download="leads.csv" className="btn-csv">
        <Download size={13} /> CSV
      </a>
    </div>
  );
}
