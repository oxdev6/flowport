'use client';
import React from 'react';

export default function BarMini({ items, width = 320, height = 100 }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const padding = 8;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const barW = w / items.length - 6;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {items.map((i, idx) => {
        const x = padding + idx * (barW + 6);
        const barH = (i.value / max) * h;
        const y = padding + (h - barH);
        return (
          <g key={idx}>
            <rect x={x} y={y} width={barW} height={barH} fill="rgba(96,165,250,0.6)" />
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="#e5e7eb">{i.value}</text>
            <text x={x + barW / 2} y={height - 2} textAnchor="middle" fontSize="9" fill="#93c5fd">{i.label}</text>
          </g>
        );
      })}
    </svg>
  );
}


