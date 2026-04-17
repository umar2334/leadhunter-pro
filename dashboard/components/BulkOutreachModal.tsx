'use client';
import { useState } from 'react';
import { X, Loader2, Check, Copy, ChevronDown, ChevronUp, Mail, MessageSquare, Phone } from 'lucide-react';
import type { Lead, OutreachMessages } from '@/lib/api';

interface Props {
  leads: Lead[];
  onClose: () => void;
  onMarkContacted: (ids: string[]) => void;
}

interface LeadOutreach {
  lead: Lead;
  messages: OutreachMessages | null;
  loading: boolean;
  error: boolean;
  expanded: boolean;
  activeTab: 'email' | 'whatsapp' | 'call_script';
}

export default function BulkOutreachModal({ leads, onClose, onMarkContacted }: Props) {
  const [items, setItems] = useState<LeadOutreach[]>(
    leads.map(lead => ({ lead, messages: null, loading: false, error: false, expanded: false, activeTab: 'email' }))
  );
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function generateAll() {
    setGenerating(true);
    for (let i = 0; i < items.length; i++) {
      setItems(prev => prev.map((item, idx) => idx === i ? { ...item, loading: true } : item));
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${items[i].lead.id}/outreach`, { method: 'POST' });
        const data = await res.json();
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, messages: data, loading: false, expanded: true } : item));
      } catch {
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, error: true, loading: false } : item));
      }
      await new Promise(r => setTimeout(r, 350));
    }
    setGenerating(false);
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(null), 2000);
  }

  function setTab(idx: number, tab: LeadOutreach['activeTab']) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, activeTab: tab } : item));
  }

  const doneCount = items.filter(i => i.messages).length;

  const tabs: { key: LeadOutreach['activeTab']; label: string; icon: React.ReactNode }[] = [
    { key: 'email',       label: 'Email',       icon: <Mail size={12} /> },
    { key: 'whatsapp',    label: 'WhatsApp',     icon: <MessageSquare size={12} /> },
    { key: 'call_script', label: 'Call Script',  icon: <Phone size={12} /> },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Bulk Outreach Generator</div>
            <div className="modal-sub">{leads.length} leads · {doneCount} generated · Email, WhatsApp & Call Script</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={15} /></button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {/* Generate button */}
          {doneCount === 0 && (
            <div style={{ textAlign: 'center', paddingBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#718096', marginBottom: 16, lineHeight: 1.7 }}>
                AI will write personalized <strong>Email + WhatsApp + Call Script</strong> for all <strong>{leads.length}</strong> leads — as a founder, specific to each business.
              </p>
              <button onClick={generateAll} disabled={generating}
                style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}>
                {generating ? 'Generating...' : `⚡ Generate for All ${leads.length} Leads`}
              </button>
            </div>
          )}

          {/* Progress bar */}
          {generating && (
            <div style={{ background: '#f7f8fc', border: '1px solid #e8eaf0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Loader2 size={16} style={{ color: '#6366f1', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4a5568', fontWeight: 600, marginBottom: 5 }}>
                  <span>Generating outreach messages...</span>
                  <span>{doneCount}/{leads.length}</span>
                </div>
                <div style={{ height: 5, background: '#e8eaf0', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#6366f1', borderRadius: 999, width: `${(doneCount / leads.length) * 100}%`, transition: 'width 0.4s' }} />
                </div>
              </div>
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* Lead cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, idx) => (
              <div key={item.lead.id} style={{ border: '1px solid #e8eaf0', borderRadius: 12, overflow: 'hidden' }}>

                {/* Lead row header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: item.messages ? '#f0fdf4' : '#fafbfd', cursor: item.messages ? 'pointer' : 'default', userSelect: 'none' }}
                  onClick={() => item.messages && setItems(prev => prev.map((x, i) => i === idx ? { ...x, expanded: !x.expanded } : x))}>

                  {/* Status icon */}
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: item.messages ? '#dcfce7' : item.loading ? '#eff6ff' : item.error ? '#fef2f2' : '#f7f8fc',
                    border: `1px solid ${item.messages ? '#86efac' : item.loading ? '#bfdbfe' : item.error ? '#fca5a5' : '#e8eaf0'}` }}>
                    {item.loading
                      ? <Loader2 size={13} style={{ color: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
                      : item.messages
                        ? <Check size={13} style={{ color: '#16a34a' }} />
                        : item.error
                          ? <X size={13} style={{ color: '#ef4444' }} />
                          : <span style={{ fontSize: 11, fontWeight: 800, color: '#a0aec0' }}>{idx + 1}</span>}
                  </div>

                  {/* Lead info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a202c' }}>{item.lead.name}</div>
                    <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 1 }}>{item.lead.category || item.lead.address || '—'}</div>
                  </div>

                  {/* Badges */}
                  {item.messages && (
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {['Email', 'WA', 'Call'].map(t => (
                        <span key={t} style={{ fontSize: 10, background: '#e0e7ff', color: '#6366f1', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>{t}</span>
                      ))}
                    </div>
                  )}
                  {item.messages && (item.expanded
                    ? <ChevronUp size={14} style={{ color: '#a0aec0', flexShrink: 0 }} />
                    : <ChevronDown size={14} style={{ color: '#a0aec0', flexShrink: 0 }} />)}
                </div>

                {/* Expanded messages with tabs */}
                {item.messages && item.expanded && (
                  <div style={{ borderTop: '1px solid #f0f2f7' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 0, background: '#f7f8fc', borderBottom: '1px solid #f0f2f7' }}>
                      {tabs.map((t) => (
                        <button key={t.key}
                          onClick={() => setTab(idx, t.key)}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            padding: '9px 12px', fontSize: 12, fontWeight: 600, border: 'none',
                            borderBottom: item.activeTab === t.key ? '2px solid #6366f1' : '2px solid transparent',
                            background: 'transparent',
                            color: item.activeTab === t.key ? '#6366f1' : '#718096',
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                          }}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div style={{ padding: 14 }}>
                      {item.activeTab === 'email' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div className="msg-box">
                            <div className="msg-label">
                              Subject
                              <button className="msg-copy-btn" onClick={() => copy(item.messages!.email.subject, `subj-${item.lead.id}`)}>
                                {copied === `subj-${item.lead.id}` ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                              </button>
                            </div>
                            <div className="msg-text" style={{ fontWeight: 600 }}>{item.messages.email.subject}</div>
                          </div>
                          <div className="msg-box">
                            <div className="msg-label">
                              Email Body
                              <button className="msg-copy-btn" onClick={() => copy(item.messages!.email.body, `body-${item.lead.id}`)}>
                                {copied === `body-${item.lead.id}` ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                              </button>
                            </div>
                            <div className="msg-text">{item.messages.email.body}</div>
                          </div>
                        </div>
                      )}

                      {item.activeTab === 'whatsapp' && (
                        <div className="msg-box">
                          <div className="msg-label">
                            WhatsApp Message
                            <button className="msg-copy-btn" onClick={() => copy(item.messages!.whatsapp, `wa-${item.lead.id}`)}>
                              {copied === `wa-${item.lead.id}` ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                            </button>
                          </div>
                          <div className="wa-bubble">{item.messages.whatsapp}</div>
                          <div style={{ marginTop: 12 }}>
                            <a href={`https://wa.me/?text=${encodeURIComponent(item.messages.whatsapp)}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#16a34a', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                              Open in WhatsApp ↗
                            </a>
                          </div>
                        </div>
                      )}

                      {item.activeTab === 'call_script' && (
                        <div className="msg-box">
                          <div className="msg-label">
                            Call Script
                            <button className="msg-copy-btn" onClick={() => copy(item.messages!.call_script, `call-${item.lead.id}`)}>
                              {copied === `call-${item.lead.id}` ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                            </button>
                          </div>
                          <div className="msg-text">{item.messages.call_script}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {doneCount > 0 && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid #f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafbfd', flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#718096' }}>
              {doneCount} of {leads.length} generated
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {!generating && doneCount < leads.length && (
                <button onClick={generateAll}
                  style={{ background: '#f7f8fc', border: '1px solid #e8eaf0', color: '#4a5568', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Generate Remaining
                </button>
              )}
              <button onClick={() => onMarkContacted(items.filter(i => i.messages).map(i => i.lead.id))}
                style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}>
                ✓ Mark {doneCount} as Contacted
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
