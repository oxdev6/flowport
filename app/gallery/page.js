'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      if (data.success) setItems(data.gallery);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">Live Demo Gallery</h1>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or tx…"
            className="px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.filter((it) => {
            const q = query.toLowerCase();
            return !q || it.title.toLowerCase().includes(q) || it.txHash.toLowerCase().includes(q);
          }).map((it) => (
            <Link key={it.id} href={`/visualizer/${it.chainId}/${it.txHash}`} className="bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-colors">
              <div className="font-medium text-white mb-1">{it.title}</div>
              <div className="text-xs text-blue-200 font-mono">{it.txHash}</div>
              <div className="mt-2 text-xs text-blue-300">Chain: {it.chainId}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


