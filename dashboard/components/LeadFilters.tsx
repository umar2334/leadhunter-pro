'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';

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

const selectClass =
  'bg-[#1a1a2e] border border-[#2d2d3d] text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500';

export default function LeadFilters({ filters, onChange }: Props) {
  function set(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap gap-3 mb-5">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          className="w-full bg-[#1a1a2e] border border-[#2d2d3d] text-slate-300 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500"
          placeholder="Search by name or location..."
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
      </div>

      <select className={selectClass} value={filters.opportunity_type}
        onChange={(e) => set('opportunity_type', e.target.value)}>
        {OPP_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select className={selectClass} value={filters.status}
        onChange={(e) => set('status', e.target.value)}>
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <input
        className={selectClass + ' min-w-[140px]'}
        placeholder="Category..."
        value={filters.category}
        onChange={(e) => set('category', e.target.value)}
      />
    </div>
  );
}
