'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { Lead } from '@/lib/api';
import { Phone, Globe, MapPin, Mail } from 'lucide-react';

interface Props {
  leads: Lead[];
  onStatusChange: (id: string, status: Lead['status']) => void;
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

export default function LeadTable({ leads, onStatusChange }: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(leads.length / PAGE_SIZE);
  const paginated = leads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, leads.length);

  if (!leads.length) {
    return (
      <div className="table-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#4a5568', marginBottom: 6 }}>No leads yet</div>
        <div style={{ fontSize: 13, color: '#a0aec0' }}>
          Use the Chrome extension to extract businesses from Google Maps.
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Business</th>
            <th>Category</th>
            <th>Contact</th>
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

            return (
              <tr key={lead.id}>
                {/* Business */}
                <td style={{ minWidth: 180 }}>
                  <div className="lead-name">{lead.name}</div>
                  {lead.address && (
                    <div className="lead-sub">
                      <MapPin size={10} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                        {lead.address}
                      </span>
                    </div>
                  )}
                </td>

                {/* Category */}
                <td style={{ color: '#718096', fontSize: 13 }}>{lead.category || '—'}</td>

                {/* Contact */}
                <td style={{ minWidth: 140 }}>
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} style={{ fontSize: 13, color: '#4a5568', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', fontWeight: 500 }}>
                      <Phone size={12} style={{ color: '#a0aec0', flexShrink: 0 }} />{lead.phone}
                    </a>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} style={{ fontSize: 12, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', marginTop: 3, maxWidth: 160, overflow: 'hidden' }}>
                      <Mail size={11} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</span>
                    </a>
                  )}
                  {lead.website && !lead.phone && !lead.email && (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#718096', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                      <Globe size={11} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                        {lead.website.replace(/^https?:\/\//, '').slice(0, 28)}
                      </span>
                    </a>
                  )}
                  {!lead.phone && !lead.email && !lead.website && <span style={{ color: '#cbd5e0' }}>—</span>}
                </td>

                {/* Opportunity */}
                <td><span className={opp.cls}>{opp.label}</span></td>

                {/* Score */}
                <td>
                  {score !== null ? (
                    <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor }}>{score}</span>
                  ) : <span style={{ color: '#cbd5e0' }}>—</span>}
                </td>

                {/* Status */}
                <td>
                  <select
                    className={statusBadge[lead.status]}
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
                  <Link href={`/leads/${lead.id}`} className="action-link">View</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer with pagination */}
      <div className="table-footer">
        <span className="table-footer-info">
          Showing {start} to {end} of {leads.length} leads
        </span>
        <div className="pagination">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button className="page-btn-add" title="Refresh / Add">+</button>
        </div>
      </div>
    </div>
  );
}
