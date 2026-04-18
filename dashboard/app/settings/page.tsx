'use client';
import { useState } from 'react';
import { Bell, HelpCircle, Search, Play, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://leadhunter-pro-production.up.railway.app';

export default function SettingsPage() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState('');

  async function runScan() {
    setScanning(true); setScanResult(null); setScanError('');
    try {
      const res = await fetch(`${API}/scan/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) setScanError(data.error || 'Scan failed');
      else setScanResult(data);
    } catch { setScanError('Could not reach backend — check Railway.'); }
    setScanning(false);
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-breadcrumb">
          <span>Dashboard</span><span className="sep">/</span>
          <span className="current">Settings</span>
        </div>
        <div className="topbar-right">
          <div className="topbar-search"><Search size={14} style={{ color: '#a0aec0', flexShrink: 0 }} /><input placeholder="Global search..." /></div>
          <button className="topbar-icon-btn"><Bell size={15} /></button>
          <button className="topbar-icon-btn"><HelpCircle size={15} /></button>
          <div className="topbar-avatar">U</div>
        </div>
      </div>

      <div className="page-body">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">API keys, auto-scan, and account configuration.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Auto Daily Scan */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a202c', marginBottom: 4 }}>
              🔍 Auto Daily Scan
            </h3>
            <p style={{ fontSize: 13, color: '#718096', marginBottom: 16, lineHeight: 1.6 }}>
              Automatically search Google Places for new businesses in Dubai — restaurants, clinics, salons, gyms, real estate — and save them as leads. Requires <strong>GOOGLE_PLACES_API_KEY</strong> in Railway.
            </p>

            <div style={{ background: '#f7f8fc', border: '1px solid #e8eaf0', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: '#4a5568' }}>
              <strong>How to set up:</strong><br />
              1. Go to <strong>console.cloud.google.com</strong><br />
              2. Enable <strong>Places API</strong><br />
              3. Create API Key<br />
              4. Add to Railway: <code style={{ background: '#e8eaf0', padding: '1px 6px', borderRadius: 4 }}>GOOGLE_PLACES_API_KEY = your_key</code>
            </div>

            <button onClick={runScan} disabled={scanning}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: scanning ? '#e8eaf0' : '#6366f1', color: scanning ? '#a0aec0' : '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: scanning ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {scanning ? <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Play size={14} />}
              {scanning ? 'Scanning...' : 'Run Scan Now'}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {scanResult && (
              <div style={{ marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#16a34a', fontSize: 13, marginBottom: 6 }}>
                  <CheckCircle size={14} /> Scan complete — {scanResult.saved} new leads saved
                </div>
                {scanResult.searches?.map((s: any, i: number) => (
                  <div key={i} style={{ fontSize: 11, color: '#4a5568' }}>• {s.term} in {s.location} → {s.found} found</div>
                ))}
              </div>
            )}

            {scanError && (
              <div style={{ marginTop: 14, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                <AlertCircle size={14} /> {scanError}
              </div>
            )}
          </div>

          {/* API Keys info */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a202c', marginBottom: 12 }}>
              🔑 Required API Keys (Railway Variables)
            </h3>
            {[
              { key: 'GEMINI_API_KEY', desc: 'AI outreach generation', status: 'required' },
              { key: 'SUPABASE_URL', desc: 'Database connection', status: 'required' },
              { key: 'SUPABASE_SERVICE_KEY', desc: 'Database auth', status: 'required' },
              { key: 'GOOGLE_PLACES_API_KEY', desc: 'Auto daily scan', status: 'optional' },
            ].map(({ key, desc, status }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f2f7' }}>
                <code style={{ fontSize: 12, background: '#f7f8fc', border: '1px solid #e8eaf0', borderRadius: 5, padding: '3px 8px', fontWeight: 700, color: '#4a5568', flex: 1 }}>{key}</code>
                <span style={{ fontSize: 12, color: '#718096' }}>{desc}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: status === 'required' ? '#fef2f2' : '#f0fdf4', color: status === 'required' ? '#dc2626' : '#16a34a' }}>
                  {status}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
