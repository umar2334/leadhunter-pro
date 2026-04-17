'use client';
import { Users, WifiOff, Wifi, PhoneCall, TrendingUp } from 'lucide-react';
import type { Stats } from '@/lib/api';

interface Props { stats: Stats }

export default function StatsBar({ stats }: Props) {
  const cards = [
    {
      label: 'Total Leads', value: stats.total,
      icon: <Users size={16} />, borderColor: '#6366f1',
      iconBg: 'rgba(99,102,241,0.15)', iconColor: '#818cf8', valueColor: '#fff',
    },
    {
      label: 'No Website', value: stats.no_website,
      icon: <WifiOff size={16} />, borderColor: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.15)', iconColor: '#fbbf24', valueColor: '#fbbf24',
    },
    {
      label: 'Weak Website', value: stats.weak_website,
      icon: <Wifi size={16} />, borderColor: '#f97316',
      iconBg: 'rgba(249,115,22,0.15)', iconColor: '#fb923c', valueColor: '#fb923c',
    },
    {
      label: 'Contacted', value: stats.contacted,
      icon: <PhoneCall size={16} />, borderColor: '#3b82f6',
      iconBg: 'rgba(59,130,246,0.15)', iconColor: '#60a5fa', valueColor: '#60a5fa',
    },
    {
      label: 'Converted', value: stats.converted,
      icon: <TrendingUp size={16} />, borderColor: '#10b981',
      iconBg: 'rgba(16,185,129,0.15)', iconColor: '#34d399', valueColor: '#34d399',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((c) => (
        <div key={c.label} className="stat-card" style={{ borderTopColor: c.borderColor }}>
          <div className="stat-card-icon" style={{ background: c.iconBg, color: c.iconColor }}>
            {c.icon}
          </div>
          <div className="stat-card-value" style={{ color: c.valueColor }}>{c.value}</div>
          <div className="stat-card-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
