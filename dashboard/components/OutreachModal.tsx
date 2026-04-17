'use client';
import { useState } from 'react';
import { X, Copy, Check, Loader2, Mail, MessageSquare, Phone } from 'lucide-react';
import type { OutreachMessages } from '@/lib/api';

interface Props {
  leadId: string;
  leadName: string;
  onClose: () => void;
  onMarkContacted: () => void;
}

type Tab = 'email' | 'whatsapp' | 'call_script';

export default function OutreachModal({ leadId, leadName, onClose, onMarkContacted }: Props) {
  const [messages, setMessages] = useState<OutreachMessages | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('email');
  const [copied, setCopied] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/leads/${leadId}/outreach`,
        { method: 'POST' }
      );
      const data = await res.json();
      setMessages(data);
    } catch {
      alert('Failed to generate messages — check API connection.');
    }
    setLoading(false);
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'email',       label: 'Email',       icon: <Mail className="w-4 h-4" /> },
    { key: 'whatsapp',    label: 'WhatsApp',    icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'call_script', label: 'Call Script', icon: <Phone className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#12121e] border border-[#2d2d3d] rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d3d]">
          <div>
            <h2 className="text-base font-semibold text-white">AI Outreach Generator</h2>
            <p className="text-xs text-slate-500 mt-0.5">{leadName}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!messages && !loading && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✍️</div>
              <p className="text-slate-400 text-sm mb-6">
                Generate personalized outreach messages using AI — tailored to<br />
                this business's specific situation and website weaknesses.
              </p>
              <button onClick={generate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
                Generate Messages
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Crafting personalized messages...</p>
            </div>
          )}

          {messages && (
            <>
              {/* Tabs */}
              <div className="flex gap-1 bg-[#0a0a12] rounded-lg p-1 mb-5">
                {tabs.map((t) => (
                  <button key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-md transition-colors ${
                      activeTab === t.key
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}>
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>

              {/* Email */}
              {activeTab === 'email' && (
                <div className="space-y-3">
                  <div className="bg-[#0a0a12] border border-[#2d2d3d] rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Subject</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-200">{messages.email.subject}</span>
                      <button onClick={() => copy(messages.email.subject, 'subject')}
                        className="text-slate-500 hover:text-white ml-3 flex-shrink-0">
                        {copied === 'subject' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#0a0a12] border border-[#2d2d3d] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-slate-500">Email Body</div>
                      <button onClick={() => copy(messages.email.body, 'body')}
                        className="text-slate-500 hover:text-white">
                        {copied === 'body' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                      {messages.email.body}
                    </pre>
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {activeTab === 'whatsapp' && (
                <div className="bg-[#0a0a12] border border-[#2d2d3d] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-slate-500">WhatsApp Message</div>
                    <button onClick={() => copy(messages.whatsapp, 'wa')}
                      className="text-slate-500 hover:text-white">
                      {copied === 'wa' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="inline-block bg-[#1a2e1a] border border-green-900/50 text-green-200 text-sm rounded-xl rounded-tl-none px-4 py-3 max-w-xs leading-relaxed">
                    {messages.whatsapp}
                  </div>
                  {typeof messages.whatsapp === 'string' && (
                    <div className="mt-4">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(messages.whatsapp)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                        Open in WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Call Script */}
              {activeTab === 'call_script' && (
                <div className="bg-[#0a0a12] border border-[#2d2d3d] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-slate-500">Call Script</div>
                    <button onClick={() => copy(messages.call_script, 'call')}
                      className="text-slate-500 hover:text-white">
                      {copied === 'call' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{messages.call_script}</p>
                </div>
              )}

              {/* Regenerate + mark contacted */}
              <div className="flex gap-3 mt-5">
                <button onClick={generate}
                  className="text-xs text-slate-500 hover:text-slate-300 underline">
                  Regenerate
                </button>
                <button onClick={() => { onMarkContacted(); onClose(); }}
                  className="ml-auto bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
                  Mark as Contacted
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
