'use client';
import { useMemo, useCallback, useEffect, useState } from 'react';
import ReactFlowDefault, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import GlassNode from './flow/GlassNode';

export default function GraphView({ graph, highlightedNodeId, onNodeSelect, mkEdgeTooltip }) {
  const { nodes: nodesMap, tokenTransfers } = graph || {};
  const { rfNodes, rfEdges } = useMemo(() => toReactFlow(nodesMap, tokenTransfers, mkEdgeTooltip), [nodesMap, tokenTransfers, mkEdgeTooltip]);
  const [rfInstance, setRfInstance] = useState(null);

  useEffect(() => {
    if (!rfInstance || typeof window === 'undefined') return;
    const handler = (ev) => {
      try {
        const id = String(ev?.detail || '');
        if (!id) return;
        const node = rfInstance.getNode?.(id);
        if (!node) return;
        const pos = node.positionAbsolute || node.position || { x: 0, y: 0 };
        const width = (node?.measured || node)?.width || 180;
        const height = (node?.measured || node)?.height || 54;
        const cx = pos.x + width / 2;
        const cy = pos.y + height / 2;
        rfInstance.setCenter?.(cx, cy, { zoom: 1.3, duration: 300 });
      } catch {}
    };
    window.addEventListener('centerOnNode', handler);
    return () => window.removeEventListener('centerOnNode', handler);
  }, [rfInstance]);

  const nodeTypes = useMemo(() => ({ glass: GlassNode }), []);

  const onNodeClick = useCallback((_, node) => {
    if (onNodeSelect) onNodeSelect(node.id);
  }, [onNodeSelect]);

  const styledNodes = useMemo(() => rfNodes.map((n) => ({
    ...n,
    style: {
      ...n.style,
      background: n.id === highlightedNodeId ? '#1e3a8a' : 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(147,197,253,0.6)',
      color: '#e5e7eb',
      borderRadius: 8,
      backdropFilter: 'blur(2px)'
    }
  })), [rfNodes, highlightedNodeId]);

  if (!nodesMap) return null;

  return (
    <div className="w-full h-full" style={{ background: 'transparent' }}>
      <ReactFlowDefault
        onInit={(inst)=>{ setRfInstance(inst); }}
        nodes={styledNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false, style: { stroke: '#60a5fa', strokeWidth: 2 } }}
        fitView
        onNodeClick={onNodeClick}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" gap={16} />
        <MiniMap
          pannable
          zoomable
          nodeColor={() => '#1d4ed8'}
          style={{ height: 120, width: 200, bottom: 12, right: 12, background: 'rgba(0,0,0,0.4)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <Controls />
      </ReactFlowDefault>
    </div>
  );
}

function toReactFlow(nodesMap, transfers, mkEdgeTooltip) {
  const rfNodes = [];
  const rfEdges = [];
  if (!nodesMap) return { rfNodes, rfEdges };

  const byDepth = new Map();
  for (const id in nodesMap) {
    const n = nodesMap[id];
    const list = byDepth.get(n.depth || 0) || [];
    list.push(n);
    byDepth.set(n.depth || 0, list);
  }
  const depthLevels = Array.from(byDepth.keys()).sort((a, b) => a - b);

  depthLevels.forEach((d, colIdx) => {
    const arr = byDepth.get(d) || [];
    arr.forEach((n, idx) => {
      rfNodes.push({
        id: String(n.id),
        type: 'glass',
        data: { label: short(n.functionName || n.type) + '\n' + shortAddr(n.to || n.from) },
        position: { x: colIdx * 260, y: idx * 120 },
        style: { width: 180, height: 54, padding: 8, fontSize: 12, whiteSpace: 'pre' }
      });
      if (Array.isArray(n.children)) {
        for (const childId of n.children) {
          const child = nodesMap[String(childId)];
          const shortLabel = `${short(child?.functionName || child?.type || 'call')}${child?.gasUsed ? ` • gas ${child.gasUsed}` : ''}${child?.status === 'revert' ? ' • revert' : ''}`;
          const tooltip = typeof mkEdgeTooltip === 'function'
            ? mkEdgeTooltip(n, child)
            : defaultEdgeTooltip(n, child);
          const isRevert = child?.status === 'revert';
          rfEdges.push({
            id: `${n.id}-${childId}`,
            source: String(n.id),
            target: String(childId),
            animated: false,
            label: (<span title={tooltip} className="cursor-help select-none">{shortLabel}</span>),
            style: isRevert ? { stroke: '#f87171', strokeDasharray: '6 4' } : { stroke: '#60a5fa' },
            labelStyle: isRevert ? { fill: '#fca5a5', fontSize: 10 } : { fill: '#93c5fd', fontSize: 10 }
          });
        }
      }
    });
  });
  if (Array.isArray(transfers)) {
    for (const t of transfers) {
      if (!t.atNodeId) continue;
      // draw token transfer as dashed blue edge from sender node to receiver node if they exist
      const fromId = String(t.atNodeId);
      const toId = String(t.atNodeId) + `-sink`;
      // create a lightweight sink node to visualize the transfer target if not present
      if (!rfNodes.find((n) => n.id === toId)) {
        const anchor = rfNodes.find((n) => n.id === fromId) || { position: { x: 0, y: 0 } };
        rfNodes.push({
          id: toId,
          type: 'glass',
          data: { label: `${shortAddr(t.to)}\n${t.amount} ${t.symbol}` },
          position: { x: anchor.position.x + 200, y: anchor.position.y + 60 },
          style: { width: 180, height: 54, padding: 8, fontSize: 12, whiteSpace: 'pre', background: 'rgba(59,130,246,0.08)', border: '1px dashed #60a5fa', color: '#bfdbfe' }
        });
      }
      const ttip = `${t.symbol || ''} transfer${t.amount ? `: ${t.amount}` : ''}${t.from || t.to ? `\n${t.from ? shortAddr(t.from) : ''} -> ${t.to ? shortAddr(t.to) : ''}` : ''}`.trim();
      rfEdges.push({
        id: `transfer-${fromId}-${toId}`,
        source: fromId,
        target: toId,
        label: (<span title={ttip} className="cursor-help select-none">{`${t.amount} ${t.symbol}`}</span>),
        style: { strokeDasharray: '6 4', stroke: '#60a5fa' },
        labelStyle: { fill: '#93c5fd', fontSize: 10 }
      });
    }
  }
  return { rfNodes, rfEdges };
}

function short(text) {
  if (!text) return '';
  if (text.length <= 24) return text;
  return text.slice(0, 10) + '…' + text.slice(-10);
}

function shortAddr(addr) {
  if (!addr || typeof addr !== 'string') return '';
  if (addr.length <= 10) return addr;
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}


function defaultEdgeTooltip(parent, child) {
  try {
    const left = `${child?.functionName || child?.type || 'call'}`;
    const parts = [left];
    if (typeof child?.gasUsed !== 'undefined') parts.push(`gas ${child.gasUsed}`);
    if (child?.status) parts.push(child.status);
    if (parent?.to || parent?.from || child?.to || child?.from) parts.push(`${shortAddr(parent?.to || parent?.from || '')}->${shortAddr(child?.to || child?.from || '')}`);
    return parts.join(' • ');
  } catch {
    return String(child?.functionName || child?.type || 'call');
  }
}



