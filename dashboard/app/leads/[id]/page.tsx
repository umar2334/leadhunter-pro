'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { leadsApi, type Lead } from '@/lib/api';
import OutreachModal from '@/components/OutreachModal';
import {
  ArrowLeft, Globe, Phone, MapPin, Star, ExternalLink,
  Trash2, MessageSquare, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-slate-800 text-slate-300 border-slate-700',
  contacted: 'bg-blue-950 text-blue-400 border-blue-900',
  replied:   'bg-purple-950 text-purple-400 border-purple-900',
  converted: 'bg-green-950 text-green-400 border-green-900',
  dead:      'bg-slate-900 text-slate-600 border-slate-800',
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
    } : prev);
    setReanalyzing(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
      <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
    </div>
  );

  if (!lead) return (
    <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center text-slate-500">
      Lead not found
    </div>
  );

  const oppColor = {
    no_website:   { bg: 'bg-amber-950', text: 'text-amber-400', border: 'border-amber-800' },
    weak_website: { bg: 'bg-orange-950', text: 'text-orange-400', border: 'border-orange-900' },
    has_website:  { bg: 'bg-emerald-950', text: 'text-emerald-400', border: 'border-emerald-900' },
  }[lead.opportunity_type];

  const scoreColor = !lead.analysis_score ? '#64748b'
    : lead.analysis_score < 40 ? '#ef4444'
    : lead.analysis_score < 65 ? '#f97316'
    : '#4ade80';

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      {/* Nav */}
      <nav className="border-b border-[#2d2d3d] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <button onClick={handleDelete}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" /> Delete Lead
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Business Header */}
        <div className="bg-[#12121e] border border-[#2d2d3d] rounded-2xl p-6 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{lead.name}</h1>
              {lead.category && (
                <span className="text-sm text-slate-500 mt-1 block">{lead.category}</span>
              )}

              <div className="flex flex-wrap gap-4 mt-4">
                {lead.phone && (
                  <a href={`tel:${lead.phone}`}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400">
                    <Phone className="w-4 h-4" /> {lead.phone}
                  </a>
                )}
                {lead.address && (
                  <span className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="w-4 h-4" /> {lead.address}
                  </span>
                )}
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
                    <Globe className="w-4 h-4" /> {lead.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {lead.rating && (
                  <span className="flex items-center gap-1 text-sm text-amber-400">
                    <Star className="w-4 h-4" /> {lead.rating}
                    {lead.review_count && <span className="text-slate-500">({lead.review_count})</span>}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg border ${oppColor.bg} ${oppColor.text} ${oppColor.border}`}>
                {lead.opportunity_type === 'no_website' ? '🔥 No Website'
                  : lead.opportunity_type === 'weak_website' ? '⚠️ Weak Website'
                  : '✅ Has Website'}
              </span>

              {/* Status selector */}
              <div className="flex gap-1">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => updateStatus(s)}
                    className={`text-xs px-2.5 py-1 rounded-md border transition-colors capitalize font-medium ${
                      lead.status === s ? STATUS_COLORS[s] : 'border-[#2d2d3d] text-slate-600 hover:text-slate-400'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Website Analysis */}
          <div className="bg-[#12121e] border border-[#2d2d3d] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Website Analysis</h2>
              {lead.website && (
                <button onClick={reanalyze} disabled={reanalyzing}
                  className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                  <RefreshCw className={`w-3 h-3 ${reanalyzing ? 'animate-spin' : ''}`} />
                  Re-analyze
                </button>
              )}
            </div>

            {lead.opportunity_type === 'no_website' ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">🌐</div>
                <div className="text-amber-400 font-semibold text-sm">No Website Found</div>
                <div className="text-slate-500 text-xs mt-2 leading-relaxed">
                  This business has no online presence.<br />Perfect opportunity for a new website build.
                </div>
              </div>
            ) : (
              <>
                {/* Score */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2d2d3d" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none"
                        stroke={scoreColor} strokeWidth="3"
                        strokeDasharray={`${(lead.analysis_score ?? 0)}, 100`}
                        strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: scoreColor }}>
                      {lead.analysis_score ?? '?'}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Website Score</div>
                    <div className="text-sm font-medium text-slate-300">out of 100</div>
                  </div>
                </div>

                {/* Issues */}
                {lead.analysis_issues?.length ? (
                  <div className="space-y-1.5 mb-3">
                    {lead.analysis_issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <AlertCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                        {issue}
                      </div>
                    ))}
                  </div>
                ) : null}

                {lead.analysis_summary && (
                  <p className="text-xs text-slate-500 italic border-t border-[#2d2d3d] pt-3">
                    "{lead.analysis_summary}"
                  </p>
                )}
              </>
            )}
          </div>

          {/* Notes + Outreach */}
          <div className="flex flex-col gap-4">
            {/* Outreach card */}
            <div className="bg-[#12121e] border border-[#2d2d3d] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Outreach</h2>
              <p className="text-xs text-slate-500 mb-4">
                Generate AI-personalized email, WhatsApp message, and call script — tailored to this lead's situation.
              </p>
              <button onClick={() => setShowOutreach(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Generate Outreach Messages
              </button>
              {lead.outreach_sent && (
                <div className="flex items-center gap-2 mt-3 text-xs text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Outreach sent
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-[#12121e] border border-[#2d2d3d] rounded-2xl p-5 flex-1">
              <h2 className="text-sm font-semibold text-white mb-3">Notes</h2>
              <textarea
                className="w-full bg-[#0a0a12] border border-[#2d2d3d] rounded-lg text-sm text-slate-300 p-3 resize-none focus:outline-none focus:border-indigo-500 leading-relaxed"
                rows={4}
                placeholder="Add notes about this lead..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <button onClick={saveNotes} disabled={savingNotes || notes === lead.notes}
                className="mt-2 text-xs bg-[#1a1a2e] border border-[#2d2d3d] hover:border-indigo-600 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>

        {/* Maps link */}
        {lead.maps_url && (
          <a href={lead.maps_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors">
            <MapPin className="w-3.5 h-3.5" />
            View on Google Maps
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </main>

      {showOutreach && (
        <OutreachModal
          leadId={id}
          leadName={lead.name}
          onClose={() => setShowOutreach(false)}
          onMarkContacted={async () => {
            await leadsApi.update(id, { status: 'contacted', outreach_sent: true });
            setLead(prev => prev ? { ...prev, status: 'contacted', outreach_sent: true } : prev);
          }}
        />
      )}
    </div>
  );
}
