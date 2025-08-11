import React from 'react';

export default function GlassNode({ data, selected }) {
  return (
    <div className={`w-44 rounded-xl px-3 py-2 text-center backdrop-blur-md border ${selected ? 'border-blue-400 shadow-lg' : 'border-white/20'} bg-white/10 hover:shadow-md transition-all duration-200`}> 
      <div className="text-xs font-medium text-white whitespace-pre-wrap leading-tight">{data.label}</div>
    </div>
  );
}
