'use client';
import Link from 'next/link';
import type { Lead } from '@/lib/api';
import { leadsApi } from '@/lib/api';
import { ExternalLink, Phone, Globe, MapPin, Mail, Download, ArrowUpRight } from 'lucide-react';

interface Props {
  leads: Lead[];
  onStatusChange: (id: string, status: Lead['status']) => void;
}

const oppBadge: Record<string, string> = {
  no_website:   'bg-amber-950/60 text-amber-400 border border-amber-800/60',
  weak_website: 'bg-orange-950/60 text-orange-400 border border-orange-800/60',
  has_website:  'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60',
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
  converted: 'text-emerald-400',
  dead:      'text-slate-600',
};
const STATUSES = ['new', 'contacted', 'replied', 'converted', 'dead'] as const;

export default function LeadTable({ leads, onStatusChange }: Props) {
  if (!leads.length) {
    return (
      <div className="text-center py-24 text-slate-600 bg-[#0c0c18] rounded-2xl border border-[#2d2d3d] border-dashed">
        <div className="text-5xl mb-4">📭</div>
        <div className="text-slate-500 font-medium mb-1">No leads found</div>
        <div className="text-sm text-slate-600">Use the Chrome extension to extract businesses from Google Maps.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Export bar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-600 font-medium">
          Showing <span className="text-slate-400">{leads.length}</span> leads
        </span>
        <div className="flex gap-2">
          <a
            href={leadsApi.exportXlsxUrl()}
            download="leads.xlsx"
            className="inline-flex items-center gap-1.5 text-xs bg-emerald-950/70 border border-emerald-800/70 hover:border-emerald-500 hover:bg-emerald-950 text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg transition-all font-semibold">
            <Download className="w-3.5 h-3.5" /> Export Excel
          </a>
          <a
            href={leadsApi.exportCsvUrl()}
            download="leads.csv"
            className="inline-flex items-center gap-1.5 text-xs bg-[#12121e] border border-[#2d2d3d] hover:border-slate-500 text-slate-500 hover:text-slate-300 px-3 py-1.5 rounded-lg transition-all">
            <Download className="w-3.5 h-3.5" /> CSV
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-[#2d2d3d] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0d0d1a] border-b border-[#2d2d3d]">
              {['Business', 'Category', 'Contact', 'Opportunity', 'Score', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e2e]">
            {leads.map((lead) => (
              <tr key={lead.id}
                className="bg-[#0f0f1a] hover:bg-[#14142a] transition-colors group">

                {/* Name + address */}
                <td className="px-4 py-3.5 max-w-[200px]">
                  <div className="font-semibold text-slate-200 truncate leading-snug">{lead.name}</div>
                  {lead.address && (
                    <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0 text-slate-700" />
                      <span className="truncate">{lead.address}</span>
                    </div>
                  )}
                </td>

                {/* Category */}
                <td className="px-4 py-3.5">
                  <span className="text-slate-500 text-xs">{lead.category || '—'}</span>
                </td>

                {/* Contact */}
                <td className="px-4 py-3.5 min-w-[170px]">
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors">
                      <Phone className="w-3 h-3 flex-shrink-0" />{lead.phone}
                    </a>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mt-0.5 max-w-[160px] truncate transition-colors">
                      <Mail className="w-3 h-3 flex-shrink-0" />{lead.email}
                    </a>
                  )}
                  {lead.website && (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-slate-600 hover:text-indigo-400 flex items-center gap-1.5 mt-0.5 max-w-[160px] truncate transition-colors">
                      <Globe className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{lead.website.replace(/^https?:\/\//, '').slice(0, 25)}</span>
                    </a>
                  )}
                  {!lead.phone && !lead.email && !lead.website && <span className="text-slate-700 text-xs">—</span>}
                </td>

                {/* Opportunity */}
                <td className="px-4 py-3.5">
                  <span className={`inline-flex text-[11px] px-2 py-1 rounded-full font-semibold whitespace-nowrap ${oppBadge[lead.opportunity_type]}`}>
                    {oppLabel[lead.opportunity_type]}
                  </span>
                </td>

                {/* Score */}
                <td className="px-4 py-3.5">
                  {lead.analysis_score !== null ? (
                    <div className="flex items-center gap-2 min-w-[70px]">
                      <div className="w-14 h-1.5 bg-[#2d2d3d] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${Math.max(lead.analysis_score, 4)}%`,
                          background: lead.analysis_score < 40 ? '#ef4444' : lead.analysis_score < 65 ? '#f97316' : '#4ade80',
                        }} />
                      </div>
                      <span className="text-xs font-medium text-slate-400">{lead.analysis_score}</span>
                    </div>
                  ) : <span className="text-slate-700 text-xs">—</span>}
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <select
                    className={`bg-transparent border-none text-xs font-semibold cursor-pointer focus:outline-none ${statusColors[lead.status]} capitalize`}
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead.id, e.target.value as Lead['status'])}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-[#12121e] text-slate-300 capitalize">{s}</option>
                    ))}
                  </select>
                </td>

                {/* View */}
                <td className="px-4 py-3.5">
                  <Link href={`/leads/${lead.id}`}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 group-hover:text-indigo-400 font-medium transition-colors">
                    View <ArrowUpRight className="w-3 h-3" />
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
