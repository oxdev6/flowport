'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Interface } from 'ethers';
import dynamic from 'next/dynamic';
import HelpButton from '../../HelpButton';

const GraphView = dynamic(() => import('../../../components/GraphView'), { ssr: false });

export default function VisualizerPage({ params }) {
  const { chainId, txHash } = params || {};
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [replayFrames, setReplayFrames] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [abiText, setAbiText] = useState('');
  const [compareChain, setCompareChain] = useState('');
  const [compareGraph, _setCompareGraph] = useState(null);
  const graphRef = useRef(null);

  const iface = useMemo(() => {
    try {
      if (!abiText) return null;
      const json = JSON.parse(abiText);
      return new Interface(json);
    } catch {
      return null;
    }
  }, [abiText]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/graph/${chainId}/${txHash}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        setGraph(data.graph);
      } catch (e) {
        setError(e.message);
        // Fallback demo graph
        const nodes = {
          '0': { id: '0', type: 'CALL', from: '0xfrom', to: '0xto', functionName: 'root', gasUsed: 10000, depth: 0, status: 'success', children: ['1'], logs: [] },
          '1': { id: '1', parentId: '0', type: 'CALL', from: '0xto', to: '0xcallee', functionName: 'doThing(uint256)', gasUsed: 5000, depth: 1, status: 'success', children: [], logs: [] },
        };
        setGraph({ chainId: Number(chainId), txHash: String(txHash), blocks: { number: 0, timestamp: Date.now() / 1000 }, rootNodeId: '0', nodes, tokenTransfers: [], gasTotals: { gasUsed: 15000 } });
      } finally {
        setLoading(false);
      }
    }
    if (chainId && txHash) load();
  }, [chainId, txHash]);

  useEffect(() => {
    async function loadReplay() {
      if (!chainId || !txHash) return;
      try {
        const res = await fetch(`/api/replay/${chainId}/${txHash}`, { method: 'POST' });
        const data = await res.json();
        if (data.success && Array.isArray(data.frames)) {
          setReplayFrames(data.frames);
          if (data.frames.length > 0) {
            setCurrentStep(0);
            setSelectedNodeId(data.frames[0].nodeId);
          }
        }
      } catch {
        // Fallback using graph nodes order when available
        if (graph) {
          const ids = Object.keys(graph.nodes || {});
          const frames = ids.map((id, i) => ({ step: i, nodeId: id, gasUsedCumulative: Number(graph.nodes[id]?.gasUsed || 0) }));
          setReplayFrames(frames);
          if (typeof window !== 'undefined') window.__replayFrames__ = frames;
          if (frames.length > 0) {
            setCurrentStep(0);
            setSelectedNodeId(frames[0].nodeId);
          }
        }
      }
    }
    loadReplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, txHash, graph]);

  useEffect(() => {
    function onSelectNode(ev) {
      try {
        const id = ev?.detail;
        if (!id) return;
        setSelectedNodeId(String(id));
        // attempt to sync timeline to the frame for this node
        const idx = (replayFrames || []).findIndex((f) => String(f.nodeId) === String(id));
        if (idx >= 0) setCurrentStep(idx);
      } catch {}
    }
    window.addEventListener('selectNode', onSelectNode);
    return () => window.removeEventListener('selectNode', onSelectNode);
  }, [replayFrames]);

  useEffect(() => {
    try { if (typeof window !== 'undefined') window.__lastSelectedNodeId__ = selectedNodeId; } catch {}
  }, [selectedNodeId]);

  useEffect(() => {
    if (!isPlaying || replayFrames.length === 0) return;
    const interval = Math.max(150, 900 / Math.max(0.25, Math.min(4, speed)));
    const id = setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % replayFrames.length;
        const frame = replayFrames[next];
        if (frame?.nodeId) setSelectedNodeId(frame.nodeId);
        return next;
      });
    }, interval);
    return () => clearInterval(id);
  }, [isPlaying, replayFrames, speed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-white">Transaction Visualizer</h1>
        <div className="text-sm text-blue-200 font-mono">Chain {chainId} — {txHash}</div>
        {loading && <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-blue-200">Loading graph…</div>}
        {error && <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-red-400">{error}</div>}
        {graph && (
          <div className="grid grid-cols-4 gap-4">
            <div ref={graphRef} className="col-span-3 bg-white/10 border border-white/20 rounded-xl p-2 h-[70vh] text-blue-200">
              <GraphView
                graph={graph}
                highlightedNodeId={selectedNodeId}
                onNodeSelect={setSelectedNodeId}
                mkEdgeTooltip={(parent, child) => mkTooltipFromAbi(parent, child, iface)}
              />
            </div>
            <div className="col-span-1 bg-white/10 border border-white/20 rounded-xl p-4 h-[70vh] overflow-auto text-blue-200 space-y-3">
              <div className="text-white font-semibold text-lg">Details</div>
              <div className="text-blue-200 text-sm mb-2">Nodes: {Object.keys(graph.nodes || {}).length}</div>
              <div className="text-blue-200 text-sm mb-2">Gas: {graph.gasTotals?.gasUsed}</div>
              <div>
                <div className="text-xs text-blue-200 mb-1">Paste ABI (optional for decoding)</div>
                <textarea value={abiText} onChange={(e)=>setAbiText(e.target.value)} placeholder="[ ... ABI JSON ... ]" className="w-full h-24 p-2 bg-black/30 border border-white/10 rounded text-blue-100 placeholder-blue-300 text-xs font-mono" />
              </div>
              {selectedNodeId && (
                <div className="relative rounded-xl overflow-hidden border border-white/20">
                  <div className={`${graph.nodes[selectedNodeId]?.status === 'revert' ? 'bg-red-600' : 'bg-green-600'} h-1 w-full`} />
                  <div className="p-3 space-y-1 bg-white/5 backdrop-blur">
                    <div className="text-white text-sm font-medium">Node {selectedNodeId}</div>
                    <div className="text-blue-200 text-xs break-all">{graph.nodes[selectedNodeId]?.functionName || graph.nodes[selectedNodeId]?.type}</div>
                    <div className="text-blue-200 text-xs font-mono">to: {shortAddr(graph.nodes[selectedNodeId]?.to)}</div>
                    <div className="text-blue-200 text-xs">gasUsed: {graph.nodes[selectedNodeId]?.gasUsed}</div>
                    {Array.isArray(graph.nodes[selectedNodeId]?.logs) && graph.nodes[selectedNodeId].logs.length > 0 && (
                      <div className="mt-2 text-xs">
                        <div className="text-blue-100 font-medium mb-1">Logs</div>
                        <ul className="space-y-1">
                          {graph.nodes[selectedNodeId].logs.slice(0,5).map((l, idx) => {
                            let decoded = null;
                            if (iface && l?.topics && l?.data) {
                              try { decoded = iface.parseLog({ topics: l.topics, data: l.data }); } catch {}
                            }
                            return (
                              <li key={idx} className="bg-black/30 border border-white/10 rounded p-2 font-mono text-[11px] truncate">
                                {decoded ? `${decoded.name}(${decoded.args?.map(String).join(', ')})` : JSON.stringify(l)}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="col-span-4 bg-white/10 border border-white/20 rounded-xl p-3 text-blue-200">
              <div className="flex items-center gap-4">
                <button
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs"
                  onClick={() => setIsPlaying((p) => !p)}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-blue-100 text-xs" onClick={() => setCurrentStep((s)=>Math.max(0,s-1))}>Prev</button>
                <button className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-blue-100 text-xs" onClick={() => setCurrentStep((s)=>Math.min(replayFrames.length-1,s+1))}>Next</button>
                <select className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-blue-100" value={speed} onChange={(e)=>setSpeed(Number(e.target.value))}>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                </select>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, replayFrames.length - 1)}
                  value={currentStep}
                  onChange={(e) => {
                    const step = Number(e.target.value);
                    setCurrentStep(step);
                    const frame = replayFrames[step];
                    if (frame?.nodeId) setSelectedNodeId(frame.nodeId);
                  }}
                  className="w-full accent-blue-400"
                />
                <div className="text-xs text-blue-300 whitespace-nowrap">Step {currentStep + 1}/{Math.max(1, replayFrames.length)}</div>
              </div>
              {replayFrames[currentStep] && (
                <div className="mt-2 text-xs text-blue-300">
                  node: <span className="font-mono text-blue-200">{replayFrames[currentStep].nodeId}</span>
                  {typeof replayFrames[currentStep].gasUsedCumulative !== 'undefined' && (
                    <span className="ml-4">gas cumulative: {replayFrames[currentStep].gasUsedCumulative}</span>
                  )}
                  <button
                    className="ml-4 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-blue-100 text-xs"
                    onClick={()=>exportReplay()}
                  >Export replay (JSON)</button>
                  <button
                    className="ml-2 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-blue-100 text-xs"
                    onClick={()=>exportReplayHtml(graph, replayFrames)}
                  >Export replay (HTML)</button>
                  <button
                    className="ml-2 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-blue-100 text-xs"
                    onClick={()=>screenshotPng(graphRef.current)}
                  >Screenshot PNG</button>
                  <button
                    className="ml-2 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-blue-100 text-xs"
                    onClick={()=>copyShareLink()}
                  >Copy link</button>
                  <button
                    className="ml-2 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-blue-100 text-xs"
                    onClick={()=>centerOnSelected()}
                  >Center graph on selected</button>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-blue-300">Diff vs chain:</span>
                <input value={compareChain} onChange={(e)=>setCompareChain(e.target.value)} placeholder="42161 or 421614" className="px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-blue-100 w-32" />
                <button className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-blue-100 text-xs" onClick={loadCompare}>Load diff</button>
              </div>
              {compareGraph && (
                <DiffPane left={graph} right={compareGraph} activeId={selectedNodeId} />
              )}
            </div>
          </div>
        )}
      </div>
      <HelpButton />
    </div>
  );
}

function shortAddr(a){if(!a)return '';return a.slice(0,6)+'…'+a.slice(-4);}

function exportReplay() {
  try {
    const data = window.__replayFrames__ || [];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'replay.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  } catch {}
}

async function loadCompare() {
  try {
    const input = document.querySelector('input[placeholder="42161 or 421614"]');
    const chain = input?.value;
    if (!chain) return;
    // naive: reuse current txHash from URL
    const txHash = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';
    const res = await fetch(`/api/graph/${chain}/${txHash}`);
    const data = await res.json();
    if (data.success) {
      window.__compareGraph__ = data.graph;
      const ev = new CustomEvent('compareGraphLoaded', { detail: data.graph });
      window.dispatchEvent(ev);
    }
  } catch {}
}

function _computeDiff(a, b) {
  try {
    const out = [];
    const an = a?.nodes || {};
    const bn = b?.nodes || {};
    for (const id in an) {
      const left = an[id];
      const right = bn[id];
      if (!right) { out.push(`- ${id} ${left.functionName || left.type}`); continue; }
      if (left.functionName !== right.functionName) out.push(`Δ ${id} fn: ${left.functionName || ''} -> ${right.functionName || ''}`);
      if (left.gasUsed !== right.gasUsed) out.push(`Δ ${id} gas: ${left.gasUsed} -> ${right.gasUsed}`);
    }
    for (const id in bn) {
      if (!an[id]) out.push(`+ ${id} ${bn[id].functionName || bn[id].type}`);
    }
    return out;
  } catch { return []; }
}

function exportReplayHtml(graph, frames) {
  try {
    const html = `<!doctype html><meta charset="utf-8"><title>Replay</title><style>
body{font-family: ui-monospace,Consolas,monospace;padding:16px;background:#0b1220;color:#bfdbfe;}
pre{white-space:pre-wrap;background:#0f1628;padding:12px;border-radius:8px;border:1px solid #1f2a44}
@media print{body{background:#ffffff;color:#111827} pre{background:#f3f4f6;border-color:#e5e7eb;color:#111827}}
</style><h1>Replay</h1><h3>Graph summary</h3><pre>${escape(JSON.stringify({ nodes:Object.keys(graph?.nodes||{}).length, gas: graph?.gasTotals?.gasUsed }, null, 2))}</pre><h3>Frames</h3><pre>${escape(JSON.stringify(frames, null, 2))}</pre>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'replay.html'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  } catch {}
  function escape(s){return String(s).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));}
}

async function screenshotPng(el) {
  try {
    if (!el) return;
    const api = (globalThis.htmlToImage || {});
    const ensureLoaded = async () => {
      if (api && typeof api.toPng === 'function') return api;
      return await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/html-to-image/dist/html-to-image.min.js';
        script.onload = () => resolve(globalThis.htmlToImage || {});
        document.body.appendChild(script);
      });
    };
    const lib = await ensureLoaded();
    if (typeof lib.toPng !== 'function') return;
    const dataUrl = await lib.toPng(el, { backgroundColor: '#0b1220' });
    const a = document.createElement('a');
    a.href = dataUrl; a.download = 'graph.png'; document.body.appendChild(a); a.click(); a.remove();
  } catch {}
}

function copyShareLink(){
  try { navigator.clipboard?.writeText(window.location.href); } catch {}
}

function DiffPane({ left, right, activeId }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const syncing = useRef(false);
  const [focusIdx, setFocusIdx] = useState(0);

  const rows = useMemo(() => alignNodes(left, right), [left, right]);

  const onScrollLeft = () => {
    if (!leftRef.current || !rightRef.current) return;
    if (syncing.current) { syncing.current = false; return; }
    syncing.current = true;
    rightRef.current.scrollTop = leftRef.current.scrollTop;
  };
  const onScrollRight = () => {
    if (!leftRef.current || !rightRef.current) return;
    if (syncing.current) { syncing.current = false; return; }
    syncing.current = true;
    leftRef.current.scrollTop = rightRef.current.scrollTop;
  };

  const onKeyDown = (e) => {
    if (!rows.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(rows.length - 1, focusIdx + 1);
      setFocusIdx(next);
      selectNode(left, rows[next].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(0, focusIdx - 1);
      setFocusIdx(prev);
      selectNode(left, rows[prev].id);
    }
  };

  const copyDiff = () => {
    try {
      const lines = rows.map((r) => {
        const parts = [`${r.id}:`];
        if (r.leftFn || r.rightFn) parts.push(`fn ${r.leftFn || ''} -> ${r.rightFn || ''}`);
        if (typeof r.leftGas !== 'undefined' || typeof r.rightGas !== 'undefined') parts.push(`gas ${r.leftGas ?? ''} -> ${r.rightGas ?? ''}`);
        return parts.join(' ');
      });
      navigator.clipboard?.writeText(lines.join('\n'));
    } catch {}
  };

  useEffect(() => {
    if (!rows.length || !activeId) return;
    const idx = rows.findIndex((r) => String(r.id) === String(activeId));
    if (idx < 0) return;
    setFocusIdx(idx);
    const elLeft = leftRef.current?.children?.[idx];
    const elRight = rightRef.current?.children?.[idx];
    elLeft?.scrollIntoView({ block: 'nearest' });
    elRight?.scrollIntoView({ block: 'nearest' });
  }, [activeId, rows]);

  return (
    <div className="mt-2" tabIndex={0} onKeyDown={onKeyDown}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-blue-200">L1/L2 Diff (synced): <span className="ml-2 text-[10px] text-blue-300">icons: <span className="text-amber-300">ƒΔ</span> fn change, <span className="text-emerald-300">⛽Δ</span> gas change</span></div>
        <button onClick={copyDiff} className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-blue-100 text-[10px]">Copy diff</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/5 border border-white/10 rounded">
          <div className="px-2 py-1 text-[11px] text-blue-100 border-b border-white/10">Left</div>
          <div ref={leftRef} onScroll={onScrollLeft} className="max-h-40 overflow-auto text-[11px] font-mono">
            {rows.map((r, i) => (
              <div key={i} className={`px-2 py-1 ${i===focusIdx ? 'ring-1 ring-blue-400' : ''} ${r.fnChanged || r.gasChanged ? 'bg-blue-600/10' : ''} hover:bg-white/10 flex items-center justify-between`}> 
                <button onClick={()=>selectNode(left, r.id)} className="text-left">
                  <span className="text-blue-300">{r.id}</span> {r.leftFn || ''}
                  {typeof r.leftGas !== 'undefined' && <span className="text-blue-400"> · gas {r.leftGas}</span>}
                  {r.fnChanged && <span className="ml-2 text-amber-300">ƒΔ</span>}
                  {r.gasChanged && <span className="ml-1 text-emerald-300">⛽Δ</span>}
                </button>
                <button onClick={()=>selectNode(left, r.id)} className="px-1 py-0.5 text-blue-200 hover:text-white">↦</button>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded">
          <div className="px-2 py-1 text-[11px] text-blue-100 border-b border-white/10">Right</div>
          <div ref={rightRef} onScroll={onScrollRight} className="max-h-40 overflow-auto text-[11px] font-mono">
            {rows.map((r, i) => (
              <div key={i} className={`px-2 py-1 ${i===focusIdx ? 'ring-1 ring-blue-400' : ''} ${r.fnChanged || r.gasChanged ? 'bg-blue-600/10' : ''} hover:bg-white/10 flex items-center justify-between`}>
                <button onClick={()=>selectNode(right, r.id)} className="text-left">
                  <span className="text-blue-300">{r.id}</span> {r.rightFn || ''}
                  {typeof r.rightGas !== 'undefined' && <span className="text-blue-400"> · gas {r.rightGas}</span>}
                  {r.fnChanged && <span className="ml-2 text-amber-300">ƒΔ</span>}
                  {r.gasChanged && <span className="ml-1 text-emerald-300">⛽Δ</span>}
                </button>
                <button onClick={()=>selectNode(right, r.id)} className="px-1 py-0.5 text-blue-200 hover:text-white">↦</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function alignNodes(a, b) {
  try {
    const out = [];
    const an = a?.nodes || {};
    const bn = b?.nodes || {};
    const ids = new Set([...Object.keys(an), ...Object.keys(bn)]);
    for (const id of Array.from(ids).sort((x,y)=>Number(x)-Number(y))) {
      const left = an[id];
      const right = bn[id];
      const leftFn = left?.functionName || left?.type;
      const rightFn = right?.functionName || right?.type;
      const leftGas = left?.gasUsed;
      const rightGas = right?.gasUsed;
      out.push({ id, leftFn, rightFn, leftGas, rightGas, fnChanged: leftFn !== rightFn, gasChanged: leftGas !== rightGas });
    }
    return out;
  } catch { return []; }
}

function selectNode(graph, id) {
  try {
    if (!graph?.nodes?.[id]) return;
    const ev = new CustomEvent('selectNode', { detail: id });
    window.dispatchEvent(ev);
  } catch {}
}

function mkTooltipFromAbi(parent, child, iface) {
  try {
    const left = `${child?.functionName || child?.type || 'call'}`;
    const gas = typeof child?.gasUsed !== 'undefined' ? `\ngas: ${child.gasUsed}` : '';
    const status = child?.status ? `\nstatus: ${child.status}` : '';
    const route = (parent?.from || parent?.to || child?.from || child?.to) ? `\n${shortAddr(parent?.to || parent?.from || '')} -> ${shortAddr(child?.to || child?.from || '')}` : '';
    const base = `${left}${gas}${status}${route}`.trim();
    const sig = child?.functionName;
    if (!sig || !iface) return base;
    // Try to parse a signature like transfer(address,uint256)
    const name = String(sig).split('(')[0];
    let frag;
    try { frag = iface.getFunction(name); } catch { frag = null; }
    if (!frag) return base;
    const inputs = frag.inputs?.map((i)=>`${i.type} ${i.name || ''}`.trim()).join(', ');
    return `${name}(${inputs})\n` + base;
  } catch { return `${child?.functionName || child?.type || 'call'}`; }
}

function centerOnSelected() {
  try {
    const step = (window.__replayFrames__ || [])[Number(document.querySelector('.text-xs.text-blue-300.whitespace-nowrap')?.textContent?.match(/Step\s(\d+)/)?.[1]) - 1];
    const nodeId = step?.nodeId || (typeof window !== 'undefined' ? window.__lastSelectedNodeId__ : '');
    const id = nodeId || '';
    if (!id) return;
    window.__lastSelectedNodeId__ = id;
    const ev = new CustomEvent('centerOnNode', { detail: id });
    window.dispatchEvent(ev);
  } catch {}
}


