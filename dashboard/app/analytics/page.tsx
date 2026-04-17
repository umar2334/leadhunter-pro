'use client';
import { useEffect, useState } from 'react';
import { leadsApi } from '@/lib/api';
import { Bell, HelpCircle, Search, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leadsApi.analytics().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const maxDaily = data ? Math.max(...data.daily.map((d: any) => d.count), 1) : 1;
  const maxCat = data ? Math.max(...(data.topCategories?.map((c: any) => c.count) || [1]), 1) : 1;
  const convRate = data?.total ? Math.round((data.status.converted / data.total) * 100) : 0;
  const contactedRate = data?.total ? Math.round(((data.status.contacted + data.status.replied + data.status.converted) / data.total) * 100) : 0;

  const oppItems = data ? [
    { label: '🔥 No Website',  count: data.opportunity.no_website,   color: '#ef4444', bg: '#fef2f2' },
    { label: '⚠️ Weak Site',   count: data.opportunity.weak_website, color: '#f97316', bg: '#fff7ed' },
    { label: '✅ Has Website', count: data.opportunity.has_website,  color: '#10b981', bg: '#e6fffa' },
  ] : [];
  const maxOpp = oppItems.length ? Math.max(...oppItems.map(o => o.count), 1) : 1;

  const funnelItems = data ? [
    { label: 'New',       count: data.status.new,       color: '#3b82f6' },
    { label: 'Contacted', count: data.status.contacted, color: '#8b5cf6' },
    { label: 'Replied',   count: data.status.replied,   color: '#a855f7' },
    { label: 'Converted', count: data.status.converted, color: '#10b981' },
    { label: 'Dead',      count: data.status.dead,      color: '#e2e8f0' },
  ] : [];
  const maxFunnel = funnelItems.length ? Math.max(...funnelItems.map(f => f.count), 1) : 1;

  const last14 = data?.daily?.slice(-14) || [];

  return (
    <>
      <div className="topbar">
        <div className="topbar-breadcrumb">
          <span>Dashboard</span><span className="sep">/</span>
          <span className="current">Analytics</span>
        </div>
        <div className="topbar-right">
          <div className="topbar-search"><Search size={14} style={{ color: '#a0aec0', flexShrink: 0 }} /><input placeholder="Global search..." /></div>
          <button className="topbar-icon-btn"><Bell size={15} /></button>
          <button className="topbar-icon-btn"><HelpCircle size={15} /></button>
          <div className="topbar-avatar">U</div>
        </div>
      </div>

      <div className="page-body">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Performance overview — leads, outreach, and conversion pipeline.</p>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <RefreshCw size={20} style={{ color: '#6366f1', animation: 'spin 0.8s linear infinite', margin: '0 auto', display: 'block' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : !data ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#a0aec0', fontSize: 14 }}>
            Could not load analytics — check API connection.
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-card-label">Total Leads</div>
                <div className="summary-card-val" style={{ color: '#6366f1' }}>{data.total}</div>
              </div>
              <div className="summary-card">
                <div className="summary-card-label">Avg Website Score</div>
                <div className="summary-card-val" style={{ color: data.avgScore < 40 ? '#ef4444' : data.avgScore < 65 ? '#f97316' : '#10b981' }}>{data.avgScore}</div>
              </div>
              <div className="summary-card">
                <div className="summary-card-label">Contacted Rate</div>
                <div className="summary-card-val" style={{ color: '#8b5cf6' }}>{contactedRate}%</div>
              </div>
              <div className="summary-card">
                <div className="summary-card-label">Conversion Rate</div>
                <div className="summary-card-val" style={{ color: '#10b981' }}>{convRate}%</div>
              </div>
            </div>

            <div className="analytics-grid">
              {/* Daily leads bar chart */}
              <div className="card">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#2d3748', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 0 }}>
                  Leads Added — Last 14 Days
                </h3>
                <div className="bar-chart-wrap">
                  {last14.map((d: any) => (
                    <div key={d.date} className="bar-col">
                      <div className="bar-val">{d.count > 0 ? d.count : ''}</div>
                      <div className="bar-fill" style={{
                        height: `${Math.max((d.count / maxDaily) * 90, d.count > 0 ? 6 : 3)}px`,
                        background: d.count > 0 ? '#6366f1' : '#f0f2f7',
                        opacity: d.count > 0 ? 1 : 0.5,
                      }} />
                      <div className="bar-label">{d.date.slice(5)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opportunity breakdown */}
              <div className="card">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#2d3748', marginBottom: 16 }}>Opportunity Breakdown</h3>
                {oppItems.map((o) => (
                  <div key={o.label} className="horiz-bar-row">
                    <span className="horiz-bar-name">{o.label}</span>
                    <div className="horiz-bar-track">
                      <div className="horiz-bar-fill" style={{ width: `${(o.count / maxOpp) * 100}%`, background: o.color }} />
                    </div>
                    <span className="horiz-bar-num">{o.count}</span>
                  </div>
                ))}
              </div>

              {/* Pipeline funnel */}
              <div className="card">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#2d3748', marginBottom: 16 }}>Pipeline Funnel</h3>
                {funnelItems.map((f) => (
                  <div key={f.label} className="horiz-bar-row">
                    <span className="horiz-bar-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                      {f.label}
                    </span>
                    <div className="horiz-bar-track">
                      <div className="horiz-bar-fill" style={{ width: `${(f.count / maxFunnel) * 100}%`, background: f.color }} />
                    </div>
                    <span className="horiz-bar-num">{f.count}</span>
                  </div>
                ))}
              </div>

              {/* Top categories */}
              <div className="card">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#2d3748', marginBottom: 16 }}>Top Categories</h3>
                {data.topCategories?.length ? data.topCategories.map((c: any) => (
                  <div key={c.name} className="horiz-bar-row">
                    <span className="horiz-bar-name">{c.name}</span>
                    <div className="horiz-bar-track">
                      <div className="horiz-bar-fill" style={{ width: `${(c.count / maxCat) * 100}%`, background: '#6366f1' }} />
                    </div>
                    <span className="horiz-bar-num">{c.count}</span>
                  </div>
                )) : <div style={{ color: '#a0aec0', fontSize: 13 }}>No category data yet.</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
