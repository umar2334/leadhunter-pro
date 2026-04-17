'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Compass, Zap, BarChart2, Settings, Brain } from 'lucide-react';

const nav = [
  { href: '/',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/lead-finder',   label: 'Lead Finder',  icon: Compass },
  { href: '/intelligence',  label: 'Intelligence', icon: Brain },
  { href: '/analytics',     label: 'Analytics',    icon: BarChart2 },
  { href: '/settings',      label: 'Settings',     icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();

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
        <div className="sidebar-enterprise-label">Enterprise</div>
        <button className="btn-upgrade">Upgrade to Enterprise</button>
      </div>
    </aside>
  );
}
