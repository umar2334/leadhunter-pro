'use client';
import { useState, useEffect, useCallback } from 'react';
import { leadsApi, type Lead, type Stats } from '@/lib/api';
import StatsBar from '@/components/StatsBar';
import LeadFilters from '@/components/LeadFilters';
import LeadTable from '@/components/LeadTable';
import OutreachModal from '@/components/OutreachModal';
import { RefreshCw, Zap } from 'lucide-react';

const DEFAULT_FILTERS = { opportunity_type: '', status: '', category: '', search: '' };
const DEFAULT_STATS: Stats = { total: 0, no_website: 0, weak_website: 0, has_website: 0, new: 0, contacted: 0, converted: 0 };

export default function HomePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [outreachLead, setOutreachLead] = useState<{ id: string; name: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.opportunity_type) params.opportunity_type = filters.opportunity_type;
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const [leadsData, statsData] = await Promise.all([
        leadsApi.list(params),
        leadsApi.stats(),
      ]);
      setLeads(leadsData.leads);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  async function handleStatusChange(id: string, status: Lead['status']) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    await leadsApi.update(id, { status });
    fetchData();
  }

  return (
    <div className="min-h-screen bg-[#08080f]">
      {/* Top Nav */}
      <nav className="border-b border-[#1e1e2e] bg-[#0a0a14]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">
            LeadHunter <span className="text-indigo-400">Pro</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-slate-600 bg-[#12121e] border border-[#2d2d3d] px-2.5 py-1 rounded-full">
            {stats.total} leads
          </span>
          <button onClick={fetchData}
            className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#1a1a2e] border border-transparent hover:border-[#2d2d3d]">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-7 flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Lead Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Businesses from Google Maps — analyzed and ready for outreach
            </p>
          </div>
        </div>

        <StatsBar stats={stats} />
        <LeadFilters filters={filters} onChange={setFilters} />

        {loading ? (
          <div className="text-center py-24 text-slate-600 bg-[#0c0c18] rounded-2xl border border-[#2d2d3d]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-3 text-indigo-500" />
            <span className="text-sm text-slate-500">Loading leads...</span>
          </div>
        ) : (
          <LeadTable
            leads={leads}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>

      {outreachLead && (
        <OutreachModal
          leadId={outreachLead.id}
          leadName={outreachLead.name}
          onClose={() => setOutreachLead(null)}
          onMarkContacted={async () => {
            await handleStatusChange(outreachLead.id, 'contacted');
            setOutreachLead(null);
          }}
        />
      )}
    </div>
  );
}
