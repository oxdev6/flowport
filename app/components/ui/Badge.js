'use client';

export default function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-white/10 text-blue-200 border-white/10',
    success: 'bg-green-500/20 text-green-200 border-green-400/30',
    warning: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30',
    danger: 'bg-red-500/20 text-red-200 border-red-400/30',
    info: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
  };
  return (
    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${tones[tone] || tones.neutral} ${className}`}>{children}</span>
  );
}


