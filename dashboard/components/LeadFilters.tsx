'use client';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface Filters {
  opportunity_type: string;
  status: string;
  category: string;
  search: string;
}
interface Props { filters: Filters; onChange: (f: Filters) => void; }

const OPP_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'no_website', label: '🔥 No Website' },
  { value: 'weak_website', label: '⚠️ Weak Site' },
  { value: 'has_website', label: '✅ Has Website' },
];
const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'replied', label: 'Replied' },
  { value: 'converted', label: 'Converted' },
  { value: 'dead', label: 'Dead' },
];

export default function LeadFilters({ filters, onChange }: Props) {
  function set(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }
  const hasActive = filters.opportunity_type || filters.status || filters.category || filters.search;

  return (
    <div className="filter-bar">
      <span className="filter-label">
        <SlidersHorizontal size={13} /> Filters
      </span>

      <div className="filter-search">
        <Search size={14} />
        <input
          className="filter-input"
          placeholder="Search by name or location..."
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>

      <select className="filter-input" value={filters.opportunity_type}
        onChange={(e) => set('opportunity_type', e.target.value)}
        style={{ background: 'var(--bg)', cursor: 'pointer' }}>
        {OPP_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select className="filter-input" value={filters.status}
        onChange={(e) => set('status', e.target.value)}
        style={{ background: 'var(--bg)', cursor: 'pointer' }}>
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <input
        className="filter-input"
        placeholder="Category..."
        value={filters.category}
        onChange={(e) => set('category', e.target.value)}
        style={{ minWidth: 130 }}
      />

      {hasActive && (
        <button className="filter-clear"
          onClick={() => onChange({ opportunity_type: '', status: '', category: '', search: '' })}>
          <X size={13} /> Clear
        </button>
      )}
    </div>
  );
}
