'use client';
import { Users, Wifi, WifiOff, PhoneCall, TrendingUp } from 'lucide-react';
import type { Stats } from '@/lib/api';

interface Props { stats: Stats }

const cards = (s: Stats) => [
  {
    label: 'Total Leads',
    value: s.total,
    icon: <Users className="w-4 h-4" />,
    accent: 'border-indigo-500',
    iconBg: 'bg-indigo-500/10 text-indigo-400',
    value_color: 'text-white',
  },
  {
    label: 'No Website',
    value: s.no_website,
    icon: <WifiOff className="w-4 h-4" />,
    accent: 'border-amber-500',
    iconBg: 'bg-amber-500/10 text-amber-400',
    value_color: 'text-amber-400',
  },
  {
    label: 'Weak Website',
    value: s.weak_website,
    icon: <Wifi className="w-4 h-4" />,
    accent: 'border-orange-500',
    iconBg: 'bg-orange-500/10 text-orange-400',
    value_color: 'text-orange-400',
  },
  {
    label: 'Contacted',
    value: s.contacted,
    icon: <PhoneCall className="w-4 h-4" />,
    accent: 'border-blue-500',
    iconBg: 'bg-blue-500/10 text-blue-400',
    value_color: 'text-blue-400',
  },
  {
    label: 'Converted',
    value: s.converted,
    icon: <TrendingUp className="w-4 h-4" />,
    accent: 'border-emerald-500',
    iconBg: 'bg-emerald-500/10 text-emerald-400',
    value_color: 'text-emerald-400',
  },
];

export default function StatsBar({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {cards(stats).map((c) => (
        <div key={c.label}
          className={`relative bg-[#12121e] border border-[#2d2d3d] border-t-2 ${c.accent} rounded-xl p-4 overflow-hidden`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`p-1.5 rounded-lg ${c.iconBg}`}>{c.icon}</div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${c.value_color}`}>{c.value}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-medium">{c.label}</div>
          {/* subtle bg glow */}
          <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-10 ${c.accent.replace('border-', 'bg-')}`} />
        </div>
      ))}
    </div>
  );
}
