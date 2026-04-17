'use client';
import { Bell, HelpCircle, Search, ExternalLink, Chrome, MapPin, Zap, Download } from 'lucide-react';

const steps = [
  { step: '1', icon: <Chrome size={22} style={{ color: '#6366f1' }} />, title: 'Open Chrome Extension', desc: 'Click the LeadHunter Pro icon in your Chrome toolbar to open the popup.' },
  { step: '2', icon: <MapPin size={22} style={{ color: '#ef4444' }} />, title: 'Go to Google Maps', desc: 'Search for a business type in any city (e.g. "restaurants in Dubai").' },
  { step: '3', icon: <Zap size={22} style={{ color: '#f59e0b' }} />, title: 'Bulk Extract', desc: 'Click "Bulk Extract" in the extension to capture up to 50 businesses at once with one click.' },
  { step: '4', icon: <Download size={22} style={{ color: '#10b981' }} />, title: 'View in Dashboard', desc: 'Leads appear here automatically — analyzed, scored, and ready for outreach.' },
];

export default function LeadFinderPage() {
  return (
    <>
      <div className="topbar">
        <div className="topbar-breadcrumb">
          <span>Dashboard</span>
          <span className="sep">/</span>
          <span className="current">Lead Finder</span>
        </div>
        <div className="topbar-right">
          <div className="topbar-search">
            <Search size={14} style={{ color: '#a0aec0', flexShrink: 0 }} />
            <input placeholder="Global search..." />
          </div>
          <button className="topbar-icon-btn"><Bell size={15} /></button>
          <button className="topbar-icon-btn"><HelpCircle size={15} /></button>
          <div className="topbar-avatar">U</div>
        </div>
      </div>

      <div className="page-body">
        <h1 className="page-title">Lead Finder</h1>
        <p className="page-subtitle">Extract businesses from Google Maps using the Chrome extension.</p>

        {/* How it works */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          {steps.map((s) => (
            <div key={s.step} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f7f8fc', border: '1px solid #e8eaf0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366f1', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.step}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a202c', marginBottom: 5 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick launch */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.03) 100%)', borderColor: 'rgba(99,102,241,0.2)' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1a202c', marginBottom: 4 }}>Ready to find leads?</div>
            <div style={{ fontSize: 13, color: '#718096' }}>Open Google Maps and use the extension to start extracting businesses.</div>
          </div>
          <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: '#6366f1', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'background 0.15s', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#4f46e5')} onMouseLeave={e => (e.currentTarget.style.background = '#6366f1')}>
            <MapPin size={16} /> Open Google Maps <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </>
  );
}
