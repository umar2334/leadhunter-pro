'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Lead } from '@/lib/api';
import { Globe, MapPin, Mail, Phone, MessageSquare, Trash2 } from 'lucide-react';

interface Props {
  leads: Lead[];
  onStatusChange: (id: string, status: Lead['status']) => void;
  onDelete: (id: string) => void;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (all: boolean) => void;
}

const STATUSES = ['new', 'contacted', 'replied', 'converted', 'dead'] as const;
const PAGE_SIZE = 10;

const oppBadge = {
  no_website:   { cls: 'opp-badge opp-none', label: '🔥 No Website' },
  weak_website: { cls: 'opp-badge opp-weak', label: '⚠️ Weak Site' },
  has_website:  { cls: 'opp-badge opp-has',  label: '✅ Has Site' },
};
const statusBadge: Record<string, string> = {
  new:       'status-badge sb-new',
  contacted: 'status-badge sb-contacted',
  replied:   'status-badge sb-replied',
  converted: 'status-badge sb-converted',
  dead:      'status-badge sb-dead',
};

export default function LeadTable({ leads, onStatusChange, onDelete, selectedIds, onToggle, onToggleAll }: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(leads.length / PAGE_SIZE);
  const paginated = leads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, leads.length);
  const allSelected = paginated.length > 0 && paginated.every(l => selectedIds.has(l.id));

  if (!leads.length) {
    return (
      <div className="table-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#4a5568', marginBottom: 6 }}>No leads yet</div>
        <div style={{ fontSize: 13, color: '#a0aec0' }}>Use the Chrome extension to extract businesses from Google Maps.</div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input type="checkbox" className="row-checkbox"
                checked={allSelected} onChange={(e) => onToggleAll(e.target.checked)} />
            </th>
            <th>Business</th>
            <th>Category</th>
            <th>Phone</th>
            <th>WhatsApp</th>
            <th>Email</th>
            <th>Website</th>
            <th>Opportunity</th>
            <th>Score</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((lead) => {
            const opp = oppBadge[lead.opportunity_type];
            const score = lead.analysis_score;
            const scoreColor = !score ? '#a0aec0' : score < 40 ? '#ef4444' : score < 65 ? '#f97316' : '#10b981';
            const isSelected = selectedIds.has(lead.id);

            return (
              <tr key={lead.id} style={{ background: isSelected ? '#f5f3ff' : undefined }}>
                {/* Checkbox */}
                <td>
                  <input type="checkbox" className="row-checkbox"
                    checked={isSelected} onChange={() => onToggle(lead.id)} />
                </td>

                {/* Business */}
                <td style={{ minWidth: 160 }}>
                  <div className="lead-name">{lead.name}</div>
                  {lead.address && (
                    <div className="lead-sub">
                      <MapPin size={10} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{lead.address}</span>
                    </div>
                  )}
                </td>

                {/* Category */}
                <td style={{ color: '#718096', fontSize: 12 }}>{lead.category || '—'}</td>

                {/* Phone — own column */}
                <td style={{ minWidth: 130 }}>
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} style={{ fontSize: 13, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', fontWeight: 500 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#6366f1')} onMouseLeave={e => (e.currentTarget.style.color = '#2d3748')}>
                      <Phone size={12} style={{ color: '#a0aec0', flexShrink: 0 }} />{lead.phone}
                    </a>
                  ) : <span style={{ color: '#e2e8f0', fontSize: 13 }}>—</span>}
                </td>

                {/* WhatsApp — own column */}
                <td style={{ minWidth: 130 }}>
                  {lead.whatsapp_number ? (
                    <a href={`https://wa.me/${lead.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', fontWeight: 600 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#15803d')} onMouseLeave={e => (e.currentTarget.style.color = '#16a34a')}>
                      <MessageSquare size={12} style={{ flexShrink: 0 }} />{lead.whatsapp_number}
                    </a>
                  ) : lead.phone ? (
                    <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#a0aec0', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#16a34a')} onMouseLeave={e => (e.currentTarget.style.color = '#a0aec0')}>
                      <MessageSquare size={11} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 11 }}>Try Maps #</span>
                    </a>
                  ) : <span style={{ color: '#e2e8f0', fontSize: 13 }}>—</span>}
                </td>

                {/* Email — own column */}
                <td style={{ minWidth: 170 }}>
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} style={{ fontSize: 12, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', maxWidth: 180, overflow: 'hidden' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#4f46e5')} onMouseLeave={e => (e.currentTarget.style.color = '#6366f1')}>
                      <Mail size={11} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</span>
                    </a>
                  ) : <span style={{ color: '#e2e8f0', fontSize: 13 }}>—</span>}
                </td>

                {/* Website — own column */}
                <td style={{ minWidth: 130 }}>
                  {lead.website ? (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#718096', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', maxWidth: 150 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#6366f1')} onMouseLeave={e => (e.currentTarget.style.color = '#718096')}>
                      <Globe size={11} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 24)}
                      </span>
                    </a>
                  ) : <span style={{ color: '#e2e8f0', fontSize: 13 }}>—</span>}
                </td>

                {/* Opportunity */}
                <td><span className={opp.cls}>{opp.label}</span></td>

                {/* Score */}
                <td>
                  {score !== null ? (
                    <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor }}>{score}</span>
                  ) : <span style={{ color: '#e2e8f0' }}>—</span>}
                </td>

                {/* Status */}
                <td>
                  <select className={statusBadge[lead.status]}
                    style={{ border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit', textTransform: 'capitalize', paddingRight: 4 }}
                    value={lead.status}
                    onChange={(e) => onStatusChange(lead.id, e.target.value as Lead['status'])}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s} style={{ background: '#fff', color: '#2d3748', textTransform: 'capitalize' }}>{s}</option>
                    ))}
                  </select>
                </td>

                {/* Actions */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link href={`/leads/${lead.id}`} className="action-link">View</Link>
                    <button
                      onClick={() => { if (confirm(`Delete "${lead.name}"?`)) onDelete(lead.id); }}
                      style={{ background: '#fef2f2', border: '1px solid #fca5a5', cursor: 'pointer', color: '#ef4444', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                      title="Delete lead">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="table-footer">
        <span className="table-footer-info">
          Showing {start}–{end} of {leads.length} leads
          {selectedIds.size > 0 && <span style={{ color: '#6366f1', fontWeight: 700 }}> · {selectedIds.size} selected</span>}
        </span>
        <div className="pagination">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
