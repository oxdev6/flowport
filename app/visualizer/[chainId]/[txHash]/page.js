'use client';
import { useEffect, useState } from 'react';
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
    if (!isPlaying || replayFrames.length === 0) return;
    const id = setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % replayFrames.length;
        const frame = replayFrames[next];
        if (frame?.nodeId) setSelectedNodeId(frame.nodeId);
        return next;
      });
    }, 900);
    return () => clearInterval(id);
  }, [isPlaying, replayFrames]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-white">Transaction Visualizer</h1>
        <div className="text-sm text-blue-200 font-mono">Chain {chainId} — {txHash}</div>
        {loading && <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-blue-200">Loading graph…</div>}
        {error && <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-red-400">{error}</div>}
        {graph && (
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 bg-white/10 border border-white/20 rounded-xl p-2 h-[70vh] text-blue-200">
              <GraphView graph={graph} highlightedNodeId={selectedNodeId} onNodeSelect={setSelectedNodeId} />
            </div>
            <div className="col-span-1 bg-white/10 border border-white/20 rounded-xl p-4 h-[70vh] overflow-auto text-blue-200 space-y-3">
              <div className="text-white font-semibold text-lg">Details</div>
              <div className="text-blue-200 text-sm mb-2">Nodes: {Object.keys(graph.nodes || {}).length}</div>
              <div className="text-blue-200 text-sm mb-2">Gas: {graph.gasTotals?.gasUsed}</div>
              {selectedNodeId && (
                <div className="relative rounded-xl overflow-hidden border border-white/20">
                  <div className={`${graph.nodes[selectedNodeId]?.status === 'revert' ? 'bg-red-600' : 'bg-green-600'} h-1 w-full`} />
                  <div className="p-3 space-y-1 bg-white/5 backdrop-blur">
                    <div className="text-white text-sm font-medium">Node {selectedNodeId}</div>
                    <div className="text-blue-200 text-xs break-all">{graph.nodes[selectedNodeId]?.functionName || graph.nodes[selectedNodeId]?.type}</div>
                    <div className="text-blue-200 text-xs font-mono">to: {shortAddr(graph.nodes[selectedNodeId]?.to)}</div>
                    <div className="text-blue-200 text-xs">gasUsed: {graph.nodes[selectedNodeId]?.gasUsed}</div>
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
                </div>
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


