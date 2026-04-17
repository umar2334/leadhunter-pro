'use client';
import Link from 'next/link';
import type { Lead } from '@/lib/api';
import { leadsApi } from '@/lib/api';
import { ExternalLink, Phone, Globe, MapPin, Mail, Download } from 'lucide-react';

interface Props {
  leads: Lead[];
  onStatusChange: (id: string, status: Lead['status']) => void;
}

const oppBadge: Record<string, string> = {
  no_website:   'bg-amber-950 text-amber-400 border border-amber-800',
  weak_website: 'bg-orange-950 text-orange-400 border border-orange-900',
  has_website:  'bg-emerald-950 text-emerald-400 border border-emerald-900',
};
const oppLabel: Record<string, string> = {
  no_website:   '🔥 No Website',
  weak_website: '⚠️ Weak Site',
  has_website:  '✅ Has Site',
};
const statusColors: Record<string, string> = {
  new:       'text-slate-400',
  contacted: 'text-blue-400',
  replied:   'text-purple-400',
  converted: 'text-green-400',
  dead:      'text-slate-600',
};
const STATUSES = ['new', 'contacted', 'replied', 'converted', 'dead'] as const;

export default function LeadTable({ leads, onStatusChange }: Props) {
  if (!leads.length) {
    return (
      <div className="text-center py-20 text-slate-600">
        <div className="text-4xl mb-3">📭</div>
        <div>No leads found. Use the Chrome extension to extract businesses from Maps.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Export bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500">{leads.length} leads shown</span>
        <div className="flex gap-2">
          <a
            href={leadsApi.exportXlsxUrl()}
            download="leads.xlsx"
            className="inline-flex items-center gap-1.5 text-xs bg-emerald-950 border border-emerald-800 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg transition-colors font-semibold"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </a>
          <a
            href={leadsApi.exportCsvUrl()}
            download="leads.csv"
            className="inline-flex items-center gap-1.5 text-xs bg-[#1a1a2e] border border-[#2d2d3d] hover:border-indigo-500 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#2d2d3d]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#12121e] border-b border-[#2d2d3d]">
              {['Business', 'Category', 'Contact', 'Opportunity', 'Score', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => (
              <tr key={lead.id}
                className={`border-b border-[#2d2d3d] hover:bg-[#1a1a2e] transition-colors ${i % 2 === 0 ? 'bg-[#0f0f18]' : 'bg-[#12121e]'}`}>

                {/* Name + address */}
                <td className="px-4 py-3 max-w-[200px]">
                  <div className="font-semibold text-slate-200 truncate">{lead.name}</div>
                  {lead.address && (
                    <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />{lead.address}
                    </div>
                  )}
                </td>

                {/* Category */}
                <td className="px-4 py-3">
                  <span className="text-slate-400 text-xs">{lead.category || '—'}</span>
                </td>

                {/* Contact — phone + email + website */}
                <td className="px-4 py-3 min-w-[160px]">
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" />{lead.phone}
                    </a>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5 max-w-[160px] truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />{lead.email}
                    </a>
                  )}
                  {lead.website && (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1 mt-0.5 max-w-[160px] truncate">
                      <Globe className="w-3 h-3 flex-shrink-0" />
                      {lead.website.replace(/^https?:\/\//, '').slice(0, 25)}
                    </a>
                  )}
                  {!lead.phone && !lead.email && !lead.website && <span className="text-slate-700 text-xs">—</span>}
                </td>

                {/* Opportunity */}
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${oppBadge[lead.opportunity_type]}`}>
                    {oppLabel[lead.opportunity_type]}
                  </span>
                </td>

                {/* Score */}
                <td className="px-4 py-3">
                  {lead.analysis_score !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#2d2d3d] rounded-full">
                        <div className="h-full rounded-full" style={{
                          width: `${Math.max(lead.analysis_score, 3)}%`,
                          background: lead.analysis_score < 40 ? '#ef4444' : lead.analysis_score < 65 ? '#f97316' : '#4ade80',
                        }} />
                      </div>
                      <span className="text-xs text-slate-400">{lead.analysis_score}</span>
                    </div>
                  ) : <span className="text-slate-700 text-xs">—</span>}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <select
                    className={`bg-transparent border-none text-xs font-medium cursor-pointer focus:outline-none ${statusColors[lead.status]}`}
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead.id, e.target.value as Lead['status'])}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-[#1a1a2e] text-slate-300">{s}</option>
                    ))}
                  </select>
                </td>

                {/* View */}
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`}
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
