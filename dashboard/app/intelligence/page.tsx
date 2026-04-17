'use client';
import { Bell, HelpCircle, Search, Brain } from 'lucide-react';

export default function IntelligencePage() {
  return (
    <>
      <div className="topbar">
        <div className="topbar-breadcrumb">
          <span>Dashboard</span><span className="sep">/</span>
          <span className="current">Intelligence</span>
        </div>
        <div className="topbar-right">
          <div className="topbar-search"><Search size={14} style={{ color: '#a0aec0', flexShrink: 0 }} /><input placeholder="Global search..." /></div>
          <button className="topbar-icon-btn"><Bell size={15} /></button>
          <button className="topbar-icon-btn"><HelpCircle size={15} /></button>
          <div className="topbar-avatar">U</div>
        </div>
      </div>
      <div className="page-body">
        <h1 className="page-title">Intelligence</h1>
        <p className="page-subtitle">AI-powered insights about your leads.</p>
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Brain size={48} style={{ color: '#c3d0f0', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#4a5568', marginBottom: 8 }}>Coming Soon</div>
          <div style={{ fontSize: 13, color: '#a0aec0' }}>AI insights, patterns, and lead scoring will appear here.</div>
        </div>
      </div>
    </>
  );
}
