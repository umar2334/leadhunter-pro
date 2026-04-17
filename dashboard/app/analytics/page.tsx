'use client';
import { Bell, HelpCircle, Search, BarChart2 } from 'lucide-react';

export default function AnalyticsPage() {
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
        <p className="page-subtitle">Conversion rates and outreach performance.</p>
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <BarChart2 size={48} style={{ color: '#c3d0f0', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#4a5568', marginBottom: 8 }}>Coming Soon</div>
          <div style={{ fontSize: 13, color: '#a0aec0' }}>Charts and analytics will appear here as you collect more data.</div>
        </div>
      </div>
    </>
  );
}
