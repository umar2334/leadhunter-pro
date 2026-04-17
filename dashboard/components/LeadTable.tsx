'use client';
import Link from 'next/link';
import type { Lead } from '@/lib/api';
import { leadsApi } from '@/lib/api';
import { Phone, Globe, MapPin, Mail, Download, ArrowUpRight } from 'lucide-react';

interface Props {
  leads: Lead[];
  onStatusChange: (id: string, status: Lead['status']) => void;
}

const oppBadge = {
  no_website:   { cls: 'badge badge-fire', label: '🔥 No Website' },
  weak_website: { cls: 'badge badge-weak', label: '⚠️ Weak Site' },
  has_website:  { cls: 'badge badge-has',  label: '✅ Has Site' },
};

const statusColor: Record<string, string> = {
  new:       '#94a3b8',
  contacted: '#60a5fa',
  replied:   '#c084fc',
  converted: '#34d399',
  dead:      '#374151',
};

const STATUSES = ['new', 'contacted', 'replied', 'converted', 'dead'] as const;

export default function LeadTable({ leads, onStatusChange }: Props) {
  if (!leads.length) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>No leads found</div>
        <div style={{ fontSize: 13, color: '#475569' }}>Use the Chrome extension to extract businesses from Google Maps.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="export-bar">
        <span className="export-count">
          Showing <span>{leads.length}</span> leads
        </span>
        <div className="export-btns">
          <a href={leadsApi.exportXlsxUrl()} download="leads.xlsx" className="btn-export-excel">
            <Download size={13} /> Export Excel
          </a>
          <a href={leadsApi.exportCsvUrl()} download="leads.csv" className="btn-export-csv">
            <Download size={13} /> CSV
          </a>
        </div>
      </div>

      <div className="leads-table-wrap">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Category</th>
              <th>Contact</th>
              <th>Opportunity</th>
              <th>Score</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const opp = oppBadge[lead.opportunity_type];
              const score = lead.analysis_score;
              const scoreColor = !score ? '#64748b' : score < 40 ? '#ef4444' : score < 65 ? '#f97316' : '#4ade80';

              return (
                <tr key={lead.id}>
                  {/* Name + address */}
                  <td style={{ maxWidth: 210 }}>
                    <div style={{ fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lead.name}
                    </div>
                    {lead.address && (
                      <div style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <MapPin size={11} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.address}</span>
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td style={{ color: '#64748b', fontSize: 12 }}>{lead.category || '—'}</td>

                  {/* Contact */}
                  <td style={{ minWidth: 160 }}>
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')} onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                        <Phone size={12} />{lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} style={{ fontSize: 12, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', marginTop: 3, overflow: 'hidden', maxWidth: 170 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')} onMouseLeave={e => (e.currentTarget.style.color = '#818cf8')}>
                        <Mail size={12} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</span>
                      </a>
                    )}
                    {lead.website && (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', marginTop: 3, maxWidth: 170 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')} onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                        <Globe size={11} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lead.website.replace(/^https?:\/\//, '').slice(0, 26)}
                        </span>
                      </a>
                    )}
                    {!lead.phone && !lead.email && !lead.website && <span style={{ color: '#2d3748', fontSize: 12 }}>—</span>}
                  </td>

                  {/* Opportunity */}
                  <td><span className={opp.cls}>{opp.label}</span></td>

                  {/* Score */}
                  <td>
                    {score !== null ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 70 }}>
                        <div style={{ width: 50, height: 5, background: '#1e1e35', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(score, 4)}%`, height: '100%', background: scoreColor, borderRadius: 999 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor }}>{score}</span>
                      </div>
                    ) : <span style={{ color: '#374151', fontSize: 12 }}>—</span>}
                  </td>

                  {/* Status */}
                  <td>
                    <select
                      style={{ background: 'transparent', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none', color: statusColor[lead.status], textTransform: 'capitalize', fontFamily: 'inherit' }}
                      value={lead.status}
                      onChange={(e) => onStatusChange(lead.id, e.target.value as Lead['status'])}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s} style={{ background: '#111120', color: '#e2e8f0', textTransform: 'capitalize' }}>{s}</option>
                      ))}
                    </select>
                  </td>

                  {/* View */}
                  <td>
                    <Link href={`/leads/${lead.id}`}
                      style={{ fontSize: 12, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600, transition: 'color 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')} onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}>
                      View <ArrowUpRight size={12} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
