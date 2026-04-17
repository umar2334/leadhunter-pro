'use client';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface Filters {
  opportunity_type: string;
  status: string;
  category: string;
  search: string;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

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

const inputBase =
  'bg-[#12121e] border border-[#2d2d3d] text-slate-300 text-sm rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder-slate-600';

export default function LeadFilters({ filters, onChange }: Props) {
  function set(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  const hasActiveFilters = filters.opportunity_type || filters.status || filters.category || filters.search;

  return (
    <div className="mb-5">
      <div className="flex flex-wrap gap-2.5 items-center">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            className={`${inputBase} w-full pl-9 pr-3 py-2`}
            placeholder="Search by name or location..."
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
          />
        </div>

        <select
          className={`${inputBase} px-3 py-2 cursor-pointer`}
          value={filters.opportunity_type}
          onChange={(e) => set('opportunity_type', e.target.value)}>
          {OPP_TYPES.map((o) => <option key={o.value} value={o.value} className="bg-[#12121e]">{o.label}</option>)}
        </select>

        <select
          className={`${inputBase} px-3 py-2 cursor-pointer`}
          value={filters.status}
          onChange={(e) => set('status', e.target.value)}>
          {STATUSES.map((s) => <option key={s.value} value={s.value} className="bg-[#12121e]">{s.label}</option>)}
        </select>

        <input
          className={`${inputBase} px-3 py-2 min-w-[130px]`}
          placeholder="Category..."
          value={filters.category}
          onChange={(e) => set('category', e.target.value)}
        />

        {hasActiveFilters && (
          <button
            onClick={() => onChange({ opportunity_type: '', status: '', category: '', search: '' })}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-900/50">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
