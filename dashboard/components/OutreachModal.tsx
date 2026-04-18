'use client';
import { useState } from 'react';
import { X, Copy, Check, Loader2, Mail, MessageSquare, Phone, Send } from 'lucide-react';
import type { OutreachMessages } from '@/lib/api';

interface Props {
  leadId: string;
  leadName: string;
  leadEmail?: string | null;
  onClose: () => void;
  onMarkContacted: () => void;
}
type Tab = 'email' | 'whatsapp' | 'call_script';

export default function OutreachModal({ leadId, leadName, leadEmail, onClose, onMarkContacted }: Props) {
  const [messages, setMessages] = useState<OutreachMessages | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('email');
  const [copied, setCopied] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/outreach`, { method: 'POST' });
      const data = await res.json();
      setMessages(data);
    } catch { alert('Failed to generate — check API connection.'); }
    setLoading(false);
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(null), 2000);
  }

  const tabs = [
    { key: 'email' as Tab,       label: 'Email',       icon: <Mail size={13} /> },
    { key: 'whatsapp' as Tab,    label: 'WhatsApp',    icon: <MessageSquare size={13} /> },
    { key: 'call_script' as Tab, label: 'Call Script', icon: <Phone size={13} /> },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <div className="modal-title">AI Outreach Generator</div>
            <div className="modal-sub">{leadName}</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="modal-body">
          {!messages && !loading && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>✍️</div>
              <p style={{ fontSize: 13, color: '#718096', marginBottom: 22, lineHeight: 1.7 }}>
                Generate personalized outreach messages using AI —<br />
                tailored to this business's situation and website weaknesses.
              </p>
              <button onClick={generate}
                style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.25)', fontFamily: 'inherit' }}>
                Generate Messages
              </button>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 16px' }}>
              <Loader2 size={28} style={{ color: '#6366f1', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: 13, color: '#a0aec0' }}>Crafting personalized messages...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {messages && (
            <>
              <div className="modal-tabs">
                {tabs.map((t) => (
                  <button key={t.key} className={`modal-tab ${activeTab === t.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.key)}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {activeTab === 'email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="msg-box">
                    <div className="msg-label">
                      Subject
                      <button className="msg-copy-btn" onClick={() => copy(messages.email.subject, 'subject')}>
                        {copied === 'subject' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="msg-text" style={{ fontWeight: 600 }}>{messages.email.subject}</div>
                  </div>
                  <div className="msg-box">
                    <div className="msg-label">
                      Email Body
                      <button className="msg-copy-btn" onClick={() => copy(messages.email.body, 'body')}>
                        {copied === 'body' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="msg-text">{messages.email.body}</div>
                  </div>
                  <a href={`mailto:${leadEmail || ''}?subject=${encodeURIComponent(messages.email.subject)}&body=${encodeURIComponent(messages.email.body)}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#6366f1', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginTop: 4 }}>
                    <Send size={13} /> Send Email
                  </a>
                </div>
              )}

              {activeTab === 'whatsapp' && (
                <div className="msg-box">
                  <div className="msg-label">
                    WhatsApp Message
                    <button className="msg-copy-btn" onClick={() => copy(messages.whatsapp, 'wa')}>
                      {copied === 'wa' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="wa-bubble">{messages.whatsapp}</div>
                  <div style={{ marginTop: 14 }}>
                    <a href={`https://wa.me/?text=${encodeURIComponent(messages.whatsapp)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#16a34a', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                      Open in WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {activeTab === 'call_script' && (
                <div className="msg-box">
                  <div className="msg-label">
                    Call Script
                    <button className="msg-copy-btn" onClick={() => copy(messages.call_script, 'call')}>
                      {copied === 'call' ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="msg-text">{messages.call_script}</div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
                <button onClick={generate} style={{ fontSize: 12, color: '#a0aec0', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                  Regenerate
                </button>
                <button onClick={() => { onMarkContacted(); onClose(); }}
                  style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}>
                  Mark as Contacted ✓
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
