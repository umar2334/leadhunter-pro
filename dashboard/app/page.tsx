'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { leadsApi, type Lead, type Stats } from '@/lib/api';
import StatsBar from '@/components/StatsBar';
import LeadFilters from '@/components/LeadFilters';
import LeadTable from '@/components/LeadTable';
import OutreachModal from '@/components/OutreachModal';
import BulkOutreachModal from '@/components/BulkOutreachModal';
import { Bell, HelpCircle, RefreshCw, Search, MessageSquare, X } from 'lucide-react';

const DEFAULT_FILTERS = { opportunity_type: '', status: '', category: '', search: '' };
const DEFAULT_STATS: Stats = { total: 0, no_website: 0, weak_website: 0, has_website: 0, new: 0, contacted: 0, converted: 0 };

export default function HomePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [outreachLead, setOutreachLead] = useState<{ id: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkOutreach, setShowBulkOutreach] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const lastCountRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.opportunity_type) params.opportunity_type = filters.opportunity_type;
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      const [ld, sd] = await Promise.all([leadsApi.list(params), leadsApi.stats()]);
      setLeads(ld.leads); setStats(sd);

      // Notifications: compare with last known count
      const stored = parseInt(localStorage.getItem('lh_seen_count') || '0');
      if (lastCountRef.current === null) lastCountRef.current = sd.total;
      if (sd.total > stored) {
        setNotifCount(sd.total - stored);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  // Poll for new leads every 30s
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const sd = await leadsApi.stats();
        const stored = parseInt(localStorage.getItem('lh_seen_count') || '0');
        if (sd.total > stored) setNotifCount(sd.total - stored);
      } catch {}
    }, 30000);
    return () => clearInterval(poll);
  }, []);

  function clearNotif() {
    localStorage.setItem('lh_seen_count', String(stats.total));
    setNotifCount(0);
  }

  async function handleStatusChange(id: string, status: Lead['status']) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    await leadsApi.update(id, { status });
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll(all: boolean) {
    if (all) {
      const pageLeads = leads.slice(0, 10);
      setSelectedIds(new Set(pageLeads.map(l => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  const selectedLeads = leads.filter(l => selectedIds.has(l.id));

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-breadcrumb">
          <span>Dashboard</span>
          <span className="sep">/</span>
          <span className="current">Lead Overview</span>
        </div>
        <div className="topbar-right">
          <div className="topbar-search">
            <Search size={14} style={{ color: '#a0aec0', flexShrink: 0 }} />
            <input placeholder="Global search..."
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          </div>
          <button className="topbar-icon-btn" onClick={fetchData} title="Refresh">
            <RefreshCw size={15} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <div className="notif-bell-wrap">
            <button className="topbar-icon-btn" onClick={clearNotif} title="Notifications">
              <Bell size={15} />
            </button>
            {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
          </div>
          <button className="topbar-icon-btn"><HelpCircle size={15} /></button>
          <div className="topbar-avatar">U</div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div className="page-body">
        <h1 className="page-title">Lead Dashboard</h1>
        <p className="page-subtitle">Businesses from Google Maps — analyzed and ready for outreach.</p>

        <StatsBar stats={stats} />
        <LeadFilters filters={filters} onChange={setFilters} />

        {loading ? (
          <div className="table-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <RefreshCw size={20} style={{ color: '#6366f1', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: 13, color: '#a0aec0', marginTop: 10 }}>Loading leads...</div>
          </div>
        ) : (
          <LeadTable leads={leads} onStatusChange={handleStatusChange}
            selectedIds={selectedIds} onToggle={toggleSelect} onToggleAll={toggleAll} />
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-bar-count"><span>{selectedIds.size}</span> leads selected</span>
          <button className="bulk-btn-primary" onClick={() => setShowBulkOutreach(true)}>
            <MessageSquare size={13} /> Generate Bulk Outreach
          </button>
          <button className="bulk-btn-clear" onClick={() => setSelectedIds(new Set())}>
            <X size={12} /> Clear
          </button>
        </div>
      )}

      {outreachLead && (
        <OutreachModal leadId={outreachLead.id} leadName={outreachLead.name}
          onClose={() => setOutreachLead(null)}
          onMarkContacted={async () => {
            await handleStatusChange(outreachLead.id, 'contacted');
            setOutreachLead(null);
          }}
        />
      )}

      {showBulkOutreach && (
        <BulkOutreachModal leads={selectedLeads} onClose={() => setShowBulkOutreach(false)}
          onMarkContacted={async (ids) => {
            for (const id of ids) await handleStatusChange(id, 'contacted');
            setSelectedIds(new Set());
            setShowBulkOutreach(false);
          }}
        />
      )}
    </>
  );
}
