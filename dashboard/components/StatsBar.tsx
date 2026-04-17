'use client';
import type { Stats } from '@/lib/api';
import { Users, WifiOff, Wifi, PhoneCall, TrendingUp } from 'lucide-react';

interface Props { stats: Stats }

export default function StatsBar({ stats }: Props) {
  const cards = [
    { label: 'Total Leads',  value: stats.total,        icon: <Users size={14} />,     bar: '#6366f1', iconColor: '#6366f1' },
    { label: 'No Website',   value: stats.no_website,   icon: <WifiOff size={14} />,   bar: '#ef4444', iconColor: '#ef4444' },
    { label: 'Weak Site',    value: stats.weak_website, icon: <Wifi size={14} />,      bar: '#f97316', iconColor: '#f97316' },
    { label: 'Contacted',    value: stats.contacted,    icon: <PhoneCall size={14} />, bar: '#3b82f6', iconColor: '#3b82f6' },
    { label: 'Converted',    value: stats.converted,    icon: <TrendingUp size={14} />,bar: '#10b981', iconColor: '#10b981' },
  ];

  return (
    <div className="stats-row">
      {cards.map((c) => (
        <div key={c.label} className="stat-box">
          <div className="stat-box-header">
            <span className="stat-box-label">{c.label}</span>
            <span className="stat-box-icon" style={{ color: c.iconColor }}>{c.icon}</span>
          </div>
          <div className="stat-box-value">{c.value}</div>
          <div className="stat-box-bar" style={{ background: c.bar }} />
        </div>
      ))}
    </div>
  );
}
