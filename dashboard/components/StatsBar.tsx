'use client';
import type { Stats } from '@/lib/api';

interface Props { stats: Stats }

export default function StatsBar({ stats }: Props) {
  const cards = [
    { label: 'Total Leads',   value: stats.total,       color: 'text-white' },
    { label: '🔥 No Website', value: stats.no_website,  color: 'text-amber-400' },
    { label: '⚠️ Weak Site',  value: stats.weak_website, color: 'text-orange-400' },
    { label: '✅ Contacted',  value: stats.contacted,   color: 'text-blue-400' },
    { label: '💰 Converted',  value: stats.converted,   color: 'text-green-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="bg-[#12121e] border border-[#2d2d3d] rounded-xl p-4">
          <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          <div className="text-xs text-slate-500 mt-1">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
