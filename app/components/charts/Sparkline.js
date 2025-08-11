'use client';
import React, { useMemo } from 'react';

export default function Sparkline({ points, width = 320, height = 100, stroke = '#60a5fa' }) {
  const path = useMemo(() => buildPath(points, width, height), [points, width, height]);
  const yMax = Math.max(...points.map((p) => p.value), 1);
  const last = points[points.length - 1]?.value ?? 0;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={path.area} fill="url(#sparkFill)" />
      <path d={path.line} fill="none" stroke={stroke} strokeWidth="2" />
      <text x={width - 4} y={16} textAnchor="end" fill="#e5e7eb" fontSize="12">{last}</text>
      <text x={4} y={height - 6} fill="#93c5fd" fontSize="10">max {yMax}</text>
    </svg>
  );
}

function buildPath(points, width, height) {
  if (!Array.isArray(points) || points.length === 0) return { line: '', area: '' };
  const paddingX = 8;
  const paddingY = 8;
  const w = width - paddingX * 2;
  const h = height - paddingY * 2;
  const xStep = w / Math.max(1, points.length - 1);
  const yMax = Math.max(...points.map((p) => p.value), 1);
  const toXY = (i, v) => [paddingX + i * xStep, paddingY + h - (v / yMax) * h];

  const xy = points.map((p, i) => toXY(i, p.value));
  const line = 'M ' + xy.map(([x, y]) => `${x} ${y}`).join(' L ');
  const area = line + ` L ${paddingX + w} ${paddingY + h} L ${paddingX} ${paddingY + h} Z`;
  return { line, area };
}


