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

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  new:       { bg: 'bg-slate-800/60',   text: 'text-slate-300',  border: 'border-slate-700',  dot: 'bg-slate-400' },
  contacted: { bg: 'bg-blue-950/60',    text: 'text-blue-400',   border: 'border-blue-900',   dot: 'bg-blue-400' },
  replied:   { bg: 'bg-purple-950/60',  text: 'text-purple-400', border: 'border-purple-900', dot: 'bg-purple-400' },
  converted: { bg: 'bg-emerald-950/60', text: 'text-emerald-400',border: 'border-emerald-900',dot: 'bg-emerald-400' },
  dead:      { bg: 'bg-slate-900/60',   text: 'text-slate-600',  border: 'border-slate-800',  dot: 'bg-slate-700' },
};
const STATUSES = ['new', 'contacted', 'replied', 'converted', 'dead'] as const;

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
    leadsApi.get(id).then((data) => {
      setLead(data);
      setNotes(data.notes || '');
      setLoading(false);
    });
  }, [id]);

  async function updateStatus(status: Lead['status']) {
    if (!lead) return;
    const updated = await leadsApi.update(id, { status });
    setLead(updated);
  }

  async function saveNotes() {
    setSavingNotes(true);
    const updated = await leadsApi.update(id, { notes });
    setLead(updated);
    setSavingNotes(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete ${lead?.name}? This cannot be undone.`)) return;
    await leadsApi.delete(id);
    router.push('/');
  }

  async function reanalyze() {
    if (!lead?.website) return;
    setReanalyzing(true);
    const analysis = await leadsApi.analyze(lead.website);
    setLead(prev => prev ? {
      ...prev,
      analysis_score: analysis.score,
      analysis_issues: analysis.issues,
      analysis_summary: analysis.summary,
      email: analysis.email || prev.email,
    } : prev);
    setReanalyzing(false);
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-500">Loading lead...</span>
      </div>
    </div>
  );
  if (!lead) return (
    <div className="min-h-screen bg-[#08080f] flex items-center justify-center text-slate-500">Lead not found</div>
  );

  const oppConfig = {
    no_website:   { bg: 'bg-amber-950/60',    text: 'text-amber-400',   border: 'border-amber-800/60',   label: '🔥 No Website',   accent: 'border-t-amber-500' },
    weak_website: { bg: 'bg-orange-950/60',   text: 'text-orange-400',  border: 'border-orange-800/60',  label: '⚠️ Weak Website', accent: 'border-t-orange-500' },
    has_website:  { bg: 'bg-emerald-950/60',  text: 'text-emerald-400', border: 'border-emerald-800/60', label: '✅ Has Website',  accent: 'border-t-emerald-500' },
  }[lead.opportunity_type];

  const score = lead.analysis_score ?? 0;
  const scoreColor = !lead.analysis_score ? '#64748b'
    : score < 40 ? '#ef4444'
    : score < 65 ? '#f97316' : '#4ade80';

  const statusCfg = STATUS_CONFIG[lead.status];

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-card { background: white !important; border: 1px solid #ddd !important; color: black !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#08080f]">
        {/* Nav */}
        <nav className="border-b border-[#1e1e2e] bg-[#0a0a14]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 no-print">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight hidden sm:block">
              LeadHunter <span className="text-indigo-400">Pro</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs bg-[#12121e] border border-[#2d2d3d] hover:border-slate-500 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-all">
              <Printer className="w-3.5 h-3.5" /> Print PDF
            </button>
            <button onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-400 hover:bg-red-950/30 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-red-900/50">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-8">

          {/* Business Header Card */}
          <div className={`bg-[#10101c] border border-[#2d2d3d] border-t-2 ${oppConfig.accent} rounded-2xl p-6 mb-5 print-card`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white leading-tight">{lead.name}</h1>
                  <span className={`mt-1 shrink-0 inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${oppConfig.bg} ${oppConfig.text} ${oppConfig.border}`}>
                    {oppConfig.label}
                  </span>
                </div>
                {lead.category && (
                  <span className="text-sm text-slate-500 mt-0.5 block">{lead.category}</span>
                )}

                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
                  {lead.phone && (
                    <div className="flex items-center gap-1.5">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-indigo-400 transition-colors">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {lead.phone}
                      </a>
                      <button onClick={() => copyText(lead.phone!, 'phone')} className="text-slate-600 hover:text-slate-300 transition-colors no-print p-0.5">
                        {copied === 'phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-1.5">
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        <Mail className="w-3.5 h-3.5" /> {lead.email}
                      </a>
                      <button onClick={() => copyText(lead.email!, 'email')} className="text-slate-600 hover:text-slate-300 transition-colors no-print p-0.5">
                        {copied === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                  {lead.website && (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                      <Globe className="w-3.5 h-3.5" />
                      {lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      <ExternalLink className="w-3 h-3 text-slate-600" />
                    </a>
                  )}
                  {lead.address && (
                    <span className="flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-600" /> {lead.address}
                    </span>
                  )}
                  {lead.rating != null && (
                    <span className="flex items-center gap-1 text-sm text-amber-400">
                      <Star className="w-3.5 h-3.5" /> {lead.rating}
                      {lead.review_count != null && <span className="text-slate-600 text-xs">({lead.review_count} reviews)</span>}
                    </span>
                  )}
                </div>
              </div>

              {/* Status selector */}
              <div className="shrink-0 no-print">
                <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-2">Pipeline Status</div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    const active = lead.status === s;
                    return (
                      <button key={s} onClick={() => updateStatus(s)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-semibold capitalize transition-all ${
                          active
                            ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                            : 'border-[#2d2d3d] text-slate-600 hover:text-slate-400 hover:border-slate-600'
                        }`}>
                        {active && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Website Analysis */}
            <div className="bg-[#10101c] border border-[#2d2d3d] rounded-2xl p-5 print-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" /> Website Analysis
                </h2>
                {lead.website && (
                  <button onClick={reanalyze} disabled={reanalyzing}
                    className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1 no-print transition-colors disabled:opacity-50">
                    <RefreshCw className={`w-3 h-3 ${reanalyzing ? 'animate-spin' : ''}`} />
                    Re-analyze
                  </button>
                )}
              </div>

              {lead.opportunity_type === 'no_website' ? (
                <div className="text-center py-8 bg-amber-950/20 rounded-xl border border-amber-900/30">
                  <div className="text-4xl mb-2">🌐</div>
                  <div className="text-amber-400 font-semibold text-sm">No Website Found</div>
                  <div className="text-slate-500 text-xs mt-2 leading-relaxed max-w-[200px] mx-auto">
                    Perfect opportunity for a new website build.
                  </div>
                </div>
              ) : (
                <>
                  {/* Score display — clean bar, no SVG bug */}
                  <div className="bg-[#0a0a14] rounded-xl p-4 mb-4 border border-[#2d2d3d]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500 font-medium">Website Score</span>
                      <span className="text-2xl font-bold" style={{ color: scoreColor }}>{score}</span>
                    </div>
                    <div className="h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(score, 2)}%`, background: scoreColor }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-slate-700">
                      <span>0</span><span>50</span><span>100</span>
                    </div>
                  </div>

                  {lead.analysis_issues?.length ? (
                    <div className="space-y-2 mb-4">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Issues Found</div>
                      {lead.analysis_issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-orange-950/20 border border-orange-900/20 rounded-lg px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                          {issue}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {lead.analysis_summary && (
                    <div className="bg-[#0a0a14] rounded-lg p-3 border border-[#2d2d3d]">
                      <p className="text-xs text-slate-400 leading-relaxed italic">"{lead.analysis_summary}"</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Outreach */}
              <div className="bg-[#10101c] border border-[#2d2d3d] rounded-2xl p-5 no-print">
                <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" /> AI Outreach
                </h2>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Personalized email, WhatsApp & call script tailored to this lead.
                </p>
                <button onClick={() => setShowOutreach(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30">
                  <MessageSquare className="w-4 h-4" /> Generate Outreach Messages
                </button>
                {lead.outreach_sent && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 rounded-lg px-3 py-2">
                    <CheckCircle className="w-3.5 h-3.5" /> Outreach already sent
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-[#10101c] border border-[#2d2d3d] rounded-2xl p-5 flex-1 print-card">
                <h2 className="text-sm font-semibold text-white mb-3">Notes</h2>
                <textarea
                  className="w-full bg-[#08080f] border border-[#2d2d3d] rounded-xl text-sm text-slate-300 p-3 resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 leading-relaxed no-print placeholder-slate-700 transition-all"
                  rows={5} placeholder="Add notes about this lead..."
                  value={notes} onChange={(e) => setNotes(e.target.value)} />
                {notes && <p className="text-xs text-slate-400 hidden print:block whitespace-pre-wrap">{notes}</p>}
                <button onClick={saveNotes} disabled={savingNotes || notes === lead.notes}
                  className="mt-2.5 text-xs bg-[#1a1a2e] border border-[#2d2d3d] hover:border-indigo-600 hover:bg-indigo-950/30 text-slate-400 hover:text-white px-4 py-2 rounded-lg transition-all disabled:opacity-40 no-print font-medium">
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>

          {/* Maps link */}
          {lead.maps_url && (
            <a href={lead.maps_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors no-print">
              <MapPin className="w-3.5 h-3.5" /> View on Google Maps <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </main>

        {showOutreach && (
          <OutreachModal
            leadId={id} leadName={lead.name}
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
