'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { leadsApi, type Lead } from '@/lib/api';
import OutreachModal from '@/components/OutreachModal';
import {
  Globe, Phone, MapPin, Star, ExternalLink, Trash2,
  MessageSquare, AlertCircle, CheckCircle, RefreshCw,
  Mail, Printer, Copy, Check, Bell, HelpCircle, Search,
} from 'lucide-react';
import Link from 'next/link';

const STATUSES = ['new', 'contacted', 'replied', 'converted', 'dead'] as const;

const oppCfg = {
  no_website:   { label: '🔥 No Website',  border: '#ef4444', badge: { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' } },
  weak_website: { label: '⚠️ Weak Website', border: '#f97316', badge: { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' } },
  has_website:  { label: '✅ Has Website',  border: '#10b981', badge: { bg: '#e6fffa', color: '#0d9488', border: '#99f6e4' } },
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    leadsApi.get(id).then((d) => { setLead(d); setNotes(d.notes || ''); setLoading(false); });
  }, [id]);

  async function updateStatus(s: Lead['status']) {
    setLead(prev => prev ? { ...prev, status: s } : prev);
    await leadsApi.update(id, { status: s });
  }

  async function saveNotes() {
    setSavingNotes(true);
    const u = await leadsApi.update(id, { notes });
    setLead(u); setSavingNotes(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete ${lead?.name}? This cannot be undone.`)) return;
    await leadsApi.delete(id); router.push('/');
  }

  async function reanalyze() {
    if (!lead?.website) return;
    setReanalyzing(true);
    const a = await leadsApi.analyze(lead.website);
    setLead(prev => prev ? { ...prev, analysis_score: a.score, analysis_issues: a.issues, analysis_summary: a.summary, email: a.email || prev.email } : prev);
    setReanalyzing(false);
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', flexDirection: 'column', gap: 12 }}>
        <RefreshCw size={20} style={{ color: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 13, color: '#a0aec0' }}>Loading lead...</span>
      </div>
    </>
  );
  if (!lead) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>Lead not found</div>;

  const opp = oppCfg[lead.opportunity_type];
  const score = lead.analysis_score ?? 0;
  const scoreColor = !lead.analysis_score ? '#a0aec0' : score < 40 ? '#ef4444' : score < 65 ? '#f97316' : '#10b981';

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Topbar */}
      <div className="topbar no-print">
        <div className="topbar-breadcrumb">
          <Link href="/" style={{ color: '#a0aec0', textDecoration: 'none', fontWeight: 500, fontSize: 13, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#6366f1')} onMouseLeave={e => (e.currentTarget.style.color = '#a0aec0')}>
            Dashboard
          </Link>
          <span className="sep">/</span>
          <span className="current" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lead.name}
          </span>
        </div>
        <div className="topbar-right">
          <div className="topbar-search"><Search size={14} style={{ color: '#a0aec0', flexShrink: 0 }} /><input placeholder="Global search..." /></div>
          <button className="topbar-icon-btn"><Bell size={15} /></button>
          <button className="topbar-icon-btn"><HelpCircle size={15} /></button>
          <div className="topbar-avatar">U</div>
        </div>
      </div>

      <div className="page-body">
        {/* Actions row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }} className="no-print">
          <button className="btn-outline-sm" onClick={() => window.print()}>
            <Printer size={13} /> Print PDF
          </button>
          <button className="btn-danger-sm" onClick={handleDelete}>
            <Trash2 size={13} /> Delete
          </button>
        </div>

        {/* Header card */}
        <div className="detail-header-card" style={{ borderLeftColor: opp.border }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a202c', margin: 0, letterSpacing: '-0.3px' }}>{lead.name}</h1>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: opp.badge.bg, color: opp.badge.color, border: `1px solid ${opp.badge.border}` }}>
                  {opp.label}
                </span>
              </div>
              {lead.category && <div style={{ fontSize: 13, color: '#718096', marginBottom: 14 }}>{lead.category}</div>}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                {lead.phone && (
                  <div className="contact-row" style={{ margin: 0 }}>
                    <a href={`tel:${lead.phone}`}><Phone size={14} style={{ color: '#a0aec0' }} />{lead.phone}</a>
                    <button className="copy-btn" onClick={() => copyText(lead.phone!, 'phone')}>
                      {copied === 'phone' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
                {lead.email && (
                  <div className="contact-row" style={{ margin: 0 }}>
                    <a href={`mailto:${lead.email}`} style={{ color: '#6366f1' }}><Mail size={14} />{lead.email}</a>
                    <button className="copy-btn" onClick={() => copyText(lead.email!, 'email')}>
                      {copied === 'email' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontWeight: 500 }}>
                    <Globe size={14} style={{ color: '#a0aec0' }} />
                    {lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    <ExternalLink size={11} style={{ color: '#a0aec0' }} />
                  </a>
                )}
                {lead.address && (
                  <span style={{ fontSize: 13, color: '#718096', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} style={{ color: '#a0aec0' }} />{lead.address}
                  </span>
                )}
                {lead.rating != null && (
                  <span style={{ fontSize: 13, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                    <Star size={13} /> {lead.rating}
                    {lead.review_count != null && <span style={{ color: '#a0aec0', fontWeight: 400, fontSize: 12 }}>({lead.review_count})</span>}
                  </span>
                )}
              </div>
            </div>

            {/* Status picker */}
            <div className="no-print">
              <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Pipeline Status
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => updateStatus(s)}
                    className={`status-pill-btn ${lead.status === s ? `spb-active-${s}` : ''}`}>
                    {lead.status === s && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />}
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="detail-grid-2">
          {/* Website Analysis */}
          <div className="card">
            <h3>
              <Globe size={15} style={{ color: '#6366f1' }} /> Website Analysis
              {lead.website && (
                <button onClick={reanalyze} disabled={reanalyzing} className="no-print"
                  style={{ marginLeft: 'auto', fontSize: 11, color: '#a0aec0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', opacity: reanalyzing ? 0.5 : 1 }}>
                  <RefreshCw size={11} style={{ animation: reanalyzing ? 'spin 0.8s linear infinite' : 'none' }} /> Re-analyze
                </button>
              )}
            </h3>

            {lead.opportunity_type === 'no_website' ? (
              <div style={{ textAlign: 'center', padding: '28px 16px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fca5a5' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🌐</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>No Website Found</div>
                <div style={{ fontSize: 12, color: '#9a3412', lineHeight: 1.6 }}>Perfect opportunity for a new website build.</div>
              </div>
            ) : (
              <>
                <div className="score-row-wrap">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Website Score</span>
                    <span className="score-big" style={{ color: scoreColor }}>{score}</span>
                  </div>
                  <div className="score-track">
                    <div className="score-fill" style={{ width: `${Math.max(score, 2)}%`, background: scoreColor }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#cbd5e0', marginTop: 4 }}>
                    <span>0</span><span>50</span><span>100</span>
                  </div>
                </div>

                {lead.analysis_issues?.length ? (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Issues Found</div>
                    {lead.analysis_issues.map((issue, i) => (
                      <div key={i} className="issue-row">
                        <AlertCircle size={13} style={{ color: '#f97316', flexShrink: 0, marginTop: 1 }} />{issue}
                      </div>
                    ))}
                  </div>
                ) : null}

                {lead.analysis_summary && (
                  <div style={{ background: '#f7f8fc', border: '1px solid #e8eaf0', borderRadius: 8, padding: '10px 14px' }}>
                    <p style={{ fontSize: 12, color: '#718096', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>"{lead.analysis_summary}"</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Outreach */}
            <div className="outreach-card-light no-print">
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a202c', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={15} style={{ color: '#6366f1' }} /> AI Outreach
              </div>
              <p style={{ fontSize: 12, color: '#718096', margin: '0 0 16px', lineHeight: 1.6 }}>
                Personalized email, WhatsApp & call script for this lead.
              </p>
              <button className="btn-indigo" onClick={() => setShowOutreach(true)}>
                <MessageSquare size={15} /> Generate Outreach Messages
              </button>
              {lead.outreach_sent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '7px 12px' }}>
                  <CheckCircle size={13} /> Outreach already sent
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="card" style={{ flex: 1 }}>
              <h3>Notes</h3>
              <textarea className="notes-input no-print" rows={5}
                placeholder="Add notes about this lead..."
                value={notes} onChange={(e) => setNotes(e.target.value)} />
              {notes && <p style={{ fontSize: 12, color: '#4a5568', display: 'none', whiteSpace: 'pre-wrap' }} className="print-only">{notes}</p>}
              <button onClick={saveNotes} disabled={savingNotes || notes === lead.notes}
                className="btn-outline-sm no-print"
                style={{ marginTop: 10, opacity: (savingNotes || notes === lead.notes) ? 0.45 : 1 }}>
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>

        {lead.maps_url && (
          <a href={lead.maps_url} target="_blank" rel="noopener noreferrer" className="no-print"
            style={{ fontSize: 12, color: '#a0aec0', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#6366f1')} onMouseLeave={e => (e.currentTarget.style.color = '#a0aec0')}>
            <MapPin size={13} /> View on Google Maps <ExternalLink size={11} />
          </a>
        )}
      </div>

      {showOutreach && (
        <OutreachModal leadId={id} leadName={lead.name}
          onClose={() => setShowOutreach(false)}
          onMarkContacted={async () => {
            await leadsApi.update(id, { status: 'contacted', outreach_sent: true });
            setLead(prev => prev ? { ...prev, status: 'contacted', outreach_sent: true } : prev);
          }}
        />
      )}
    </>
  );
}
