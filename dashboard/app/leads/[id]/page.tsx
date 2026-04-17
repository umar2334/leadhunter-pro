'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { leadsApi, type Lead } from '@/lib/api';
import OutreachModal from '@/components/OutreachModal';
import {
  ArrowLeft, Globe, Phone, MapPin, Star, ExternalLink,
  Trash2, MessageSquare, AlertCircle, CheckCircle, RefreshCw,
  Mail, Printer, Copy, Check, Zap,
} from 'lucide-react';
import Link from 'next/link';

const STATUSES = ['new', 'contacted', 'replied', 'converted', 'dead'] as const;

const oppConfig = {
  no_website:   { label: '🔥 No Website',  borderColor: '#f59e0b', badgeBg: 'rgba(120,60,0,0.3)', badgeColor: '#fbbf24', badgeBorder: 'rgba(180,100,0,0.5)' },
  weak_website: { label: '⚠️ Weak Website', borderColor: '#f97316', badgeBg: 'rgba(120,40,0,0.3)', badgeColor: '#fb923c', badgeBorder: 'rgba(180,60,0,0.5)' },
  has_website:  { label: '✅ Has Website',  borderColor: '#10b981', badgeBg: 'rgba(0,100,60,0.2)',  badgeColor: '#34d399', badgeBorder: 'rgba(0,150,80,0.4)' },
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
    leadsApi.get(id).then((data) => { setLead(data); setNotes(data.notes || ''); setLoading(false); });
  }, [id]);

  async function updateStatus(status: Lead['status']) {
    if (!lead) return;
    setLead(prev => prev ? { ...prev, status } : prev);
    await leadsApi.update(id, { status });
  }

  async function saveNotes() {
    setSavingNotes(true);
    const updated = await leadsApi.update(id, { notes });
    setLead(updated); setSavingNotes(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete ${lead?.name}? This cannot be undone.`)) return;
    await leadsApi.delete(id); router.push('/');
  }

  async function reanalyze() {
    if (!lead?.website) return;
    setReanalyzing(true);
    const analysis = await leadsApi.analyze(lead.website);
    setLead(prev => prev ? { ...prev, analysis_score: analysis.score, analysis_issues: analysis.issues, analysis_summary: analysis.summary, email: analysis.email || prev.email } : prev);
    setReanalyzing(false);
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <RefreshCw size={20} style={{ color: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, color: '#64748b' }}>Loading lead...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!lead) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Lead not found</div>
  );

  const opp = oppConfig[lead.opportunity_type];
  const score = lead.analysis_score ?? 0;
  const scoreColor = !lead.analysis_score ? '#64748b' : score < 40 ? '#ef4444' : score < 65 ? '#f97316' : '#4ade80';

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Nav */}
        <nav className="lh-nav no-print">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <div className="lh-nav-logo">
            <div className="lh-nav-icon"><Zap size={15} color="#fff" /></div>
            <span className="lh-nav-title" style={{ display: 'none' }}>LeadHunter <span>Pro</span></span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary no-print" onClick={() => window.print()}>
              <Printer size={13} /> Print PDF
            </button>
            <button className="btn-danger no-print" onClick={handleDelete}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </nav>

        <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

          {/* Business Header */}
          <div className="detail-header-card" style={{ borderTopColor: opp.borderColor }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>{lead.name}</h1>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: opp.badgeBg, color: opp.badgeColor, border: `1px solid ${opp.badgeBorder}` }}>
                    {opp.label}
                  </span>
                </div>
                {lead.category && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>{lead.category}</div>}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px' }}>
                  {lead.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <a href={`tel:${lead.phone}`} style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                        <Phone size={14} style={{ color: '#64748b' }} />{lead.phone}
                      </a>
                      <button onClick={() => copyText(lead.phone!, 'phone')} className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }}>
                        {copied === 'phone' ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                  {lead.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <a href={`mailto:${lead.email}`} style={{ fontSize: 13, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                        <Mail size={14} />{lead.email}
                      </a>
                      <button onClick={() => copyText(lead.email!, 'email')} className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }}>
                        {copied === 'email' ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                  {lead.website && (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                      <Globe size={14} />
                      {lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      <ExternalLink size={11} style={{ color: '#475569' }} />
                    </a>
                  )}
                  {lead.address && (
                    <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} style={{ color: '#475569' }} />{lead.address}
                    </span>
                  )}
                  {lead.rating != null && (
                    <span style={{ fontSize: 13, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Star size={13} /> {lead.rating}
                      {lead.review_count != null && <span style={{ color: '#475569', fontSize: 12 }}>({lead.review_count})</span>}
                    </span>
                  )}
                </div>
              </div>

              {/* Status picker */}
              <div className="no-print">
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Pipeline Status
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => updateStatus(s)}
                      className={`status-btn ${lead.status === s ? `active-${s}` : ''}`}>
                      {lead.status === s && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Two column grid */}
          <div className="detail-grid">
            {/* Website Analysis */}
            <div className="detail-card">
              <h2>
                <Globe size={15} style={{ color: '#818cf8' }} /> Website Analysis
                {lead.website && (
                  <button onClick={reanalyze} disabled={reanalyzing} className="no-print"
                    style={{ marginLeft: 'auto', fontSize: 11, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', opacity: reanalyzing ? 0.5 : 1 }}>
                    <RefreshCw size={11} style={{ animation: reanalyzing ? 'spin 0.8s linear infinite' : 'none' }} /> Re-analyze
                  </button>
                )}
              </h2>

              {lead.opportunity_type === 'no_website' ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', background: 'rgba(120,60,0,0.1)', borderRadius: 12, border: '1px solid rgba(120,60,0,0.25)' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🌐</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>No Website Found</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>Perfect opportunity for a new website build.</div>
                </div>
              ) : (
                <>
                  <div className="score-bar-wrap">
                    <div className="score-bar-header">
                      <span className="score-bar-label">Website Score</span>
                      <span className="score-bar-num" style={{ color: scoreColor }}>{score}</span>
                    </div>
                    <div className="score-bar-track">
                      <div className="score-bar-fill" style={{ width: `${Math.max(score, 2)}%`, background: scoreColor }} />
                    </div>
                    <div className="score-ticks"><span>0</span><span>50</span><span>100</span></div>
                  </div>

                  {lead.analysis_issues?.length ? (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                        Issues Found
                      </div>
                      {lead.analysis_issues.map((issue, i) => (
                        <div key={i} className="issue-item">
                          <AlertCircle size={13} style={{ color: '#f97316', flexShrink: 0, marginTop: 1 }} />
                          {issue}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {lead.analysis_summary && (
                    <div style={{ background: '#0a0a14', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 14px' }}>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                        "{lead.analysis_summary}"
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Outreach */}
              <div className="outreach-card no-print">
                <h2 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={15} style={{ color: '#818cf8' }} /> AI Outreach
                </h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px', lineHeight: 1.6 }}>
                  Personalized email, WhatsApp & call script for this lead.
                </p>
                <button className="btn-primary" onClick={() => setShowOutreach(true)}>
                  <MessageSquare size={15} /> Generate Outreach Messages
                </button>
                {lead.outreach_sent && (
                  <div className="outreach-sent-badge">
                    <CheckCircle size={14} /> Outreach already sent
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="detail-card" style={{ flex: 1 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Notes
                </h2>
                <textarea className="notes-textarea no-print" rows={5}
                  placeholder="Add notes about this lead..."
                  value={notes} onChange={(e) => setNotes(e.target.value)} />
                {notes && <p style={{ fontSize: 12, color: '#94a3b8', display: 'none', whiteSpace: 'pre-wrap' }} className="print-only">{notes}</p>}
                <button onClick={saveNotes} disabled={savingNotes || notes === lead.notes}
                  className="btn-secondary no-print"
                  style={{ marginTop: 10, opacity: (savingNotes || notes === lead.notes) ? 0.4 : 1 }}>
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>

          {lead.maps_url && (
            <a href={lead.maps_url} target="_blank" rel="noopener noreferrer" className="no-print"
              style={{ fontSize: 12, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')} onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
              <MapPin size={13} /> View on Google Maps <ExternalLink size={11} />
            </a>
          )}
        </main>

        {showOutreach && (
          <OutreachModal leadId={id} leadName={lead.name}
            onClose={() => setShowOutreach(false)}
            onMarkContacted={async () => {
              await leadsApi.update(id, { status: 'contacted', outreach_sent: true });
              setLead(prev => prev ? { ...prev, status: 'contacted', outreach_sent: true } : prev);
            }}
          />
        )}
      </div>
    </>
  );
}
