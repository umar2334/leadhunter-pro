'use client';
import { useState } from 'react';
import { X, Loader2, Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';
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
}

export default function BulkOutreachModal({ leads, onClose, onMarkContacted }: Props) {
  const [items, setItems] = useState<LeadOutreach[]>(
    leads.map(lead => ({ lead, messages: null, loading: false, error: false, expanded: false }))
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
      await new Promise(r => setTimeout(r, 300));
    }
    setGenerating(false);
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(null), 2000);
  }

  const doneCount = items.filter(i => i.messages).length;

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Bulk Outreach Generator</div>
            <div className="modal-sub">{leads.length} leads selected · {doneCount} generated</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {/* Generate button */}
          {doneCount === 0 && (
            <div style={{ textAlign: 'center', paddingBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#718096', marginBottom: 16, lineHeight: 1.7 }}>
                Generate personalized outreach for all <strong>{leads.length}</strong> selected leads at once using AI.
              </p>
              <button onClick={generateAll} disabled={generating}
                style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}>
                {generating ? 'Generating...' : `⚡ Generate for All ${leads.length} Leads`}
              </button>
            </div>
          )}

          {/* Progress */}
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

          {/* Lead items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, idx) => (
              <div key={item.lead.id} style={{ border: '1px solid #e8eaf0', borderRadius: 10, overflow: 'hidden' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: item.messages ? '#f0fdf4' : '#fafbfd', cursor: item.messages ? 'pointer' : 'default' }}
                  onClick={() => item.messages && setItems(prev => prev.map((x, i) => i === idx ? { ...x, expanded: !x.expanded } : x))}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: item.messages ? '#dcfce7' : item.loading ? '#eff6ff' : item.error ? '#fef2f2' : '#f7f8fc',
                    border: `1px solid ${item.messages ? '#86efac' : item.loading ? '#bfdbfe' : item.error ? '#fca5a5' : '#e8eaf0'}` }}>
                    {item.loading ? <Loader2 size={13} style={{ color: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
                      : item.messages ? <Check size={13} style={{ color: '#16a34a' }} />
                      : item.error ? <X size={13} style={{ color: '#ef4444' }} />
                      : <span style={{ fontSize: 11, fontWeight: 800, color: '#a0aec0' }}>{idx + 1}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a202c' }}>{item.lead.name}</div>
                    <div style={{ fontSize: 11, color: '#a0aec0' }}>{item.lead.category || item.lead.address || ''}</div>
                  </div>
                  {item.messages && (item.expanded ? <ChevronUp size={14} style={{ color: '#a0aec0' }} /> : <ChevronDown size={14} style={{ color: '#a0aec0' }} />)}
                  {item.lead.email && <span style={{ fontSize: 11, background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 999, padding: '2px 8px', fontWeight: 600, flexShrink: 0 }}>{item.lead.email}</span>}
                </div>

                {/* Expanded messages */}
                {item.messages && item.expanded && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f0f2f7' }}>
                    <div style={{ paddingTop: 12 }}>
                      <div className="msg-box" style={{ marginBottom: 8 }}>
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
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {doneCount > 0 && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid #f0f2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafbfd' }}>
            <span style={{ fontSize: 12, color: '#718096' }}>
              {doneCount} of {leads.length} messages generated
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {!generating && doneCount < leads.length && (
                <button onClick={generateAll} style={{ background: '#f7f8fc', border: '1px solid #e8eaf0', color: '#4a5568', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Generate Remaining
                </button>
              )}
              <button onClick={() => onMarkContacted(items.filter(i => i.messages).map(i => i.lead.id))}
                style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✓ Mark {doneCount} as Contacted
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
