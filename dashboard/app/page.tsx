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
    <div className="min-h-screen bg-[#0a0a12]">
      {/* Top Nav */}
      <nav className="border-b border-[#2d2d3d] bg-[#0a0a12] px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-500" />
          <span className="text-white font-bold text-lg">LeadHunter <span className="text-indigo-500">Pro</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">
            {stats.total} leads total
          </span>
          <button onClick={fetchData}
            className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#1a1a2e]">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Lead Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Businesses extracted from Google Maps, analyzed and ready for outreach
          </p>
        </div>

        <StatsBar stats={stats} />

        <LeadFilters filters={filters} onChange={setFilters} />

        {loading ? (
          <div className="text-center py-20 text-slate-600">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3" />
            Loading leads...
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
