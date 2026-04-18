'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Compass, Zap, BarChart2, Settings, Brain, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';

const nav = [
  { href: '/',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/lead-finder',   label: 'Lead Finder',  icon: Compass },
  { href: '/intelligence',  label: 'Intelligence', icon: Brain },
  { href: '/analytics',     label: 'Analytics',    icon: BarChart2 },
  { href: '/settings',      label: 'Settings',     icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={17} color="#fff" />
        </div>
        <span className="sidebar-logo-text">
          LeadHunter <span>Pro</span>
        </span>
      </div>

      <nav className="sidebar-nav">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href));
          return (
            <Link key={href} href={href} className={`sidebar-link ${active ? 'active' : ''}`}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {userEmail && (
          <div style={{ padding: '10px 14px', borderTop: '1px solid #f0f2f7', marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#a0aec0', fontWeight: 600, marginBottom: 2 }}>Signed in as</div>
            <div style={{ fontSize: 12, color: '#4a5568', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
          </div>
        )}
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#718096', fontFamily: 'inherit', borderRadius: 8 }}
          onMouseOver={e => (e.currentTarget.style.background = '#fef2f2', e.currentTarget.style.color = '#ef4444')}
          onMouseOut={e => (e.currentTarget.style.background = 'none', e.currentTarget.style.color = '#718096')}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
