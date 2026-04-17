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
      const [leadsData, statsData] = await Promise.all([leadsApi.list(params), leadsApi.stats()]);
      setLeads(leadsData.leads);
      setStats(statsData);
    } catch (err) { console.error(err); }
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="lh-nav">
        <div className="lh-nav-logo">
          <div className="lh-nav-icon"><Zap size={16} color="#fff" /></div>
          <span className="lh-nav-title">LeadHunter <span>Pro</span></span>
        </div>
        <div className="lh-nav-right">
          <span className="lh-count-pill">{stats.total} leads</span>
          <button className="lh-icon-btn" onClick={fetchData} title="Refresh">
            <RefreshCw size={15} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>
      </nav>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
            Lead Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Businesses from Google Maps — analyzed and ready for outreach
          </p>
        </div>

        <StatsBar stats={stats} />
        <LeadFilters filters={filters} onChange={setFilters} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border2)' }}>
            <RefreshCw size={20} style={{ color: '#6366f1', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 10 }}>Loading leads...</div>
          </div>
        ) : (
          <LeadTable leads={leads} onStatusChange={handleStatusChange} />
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
