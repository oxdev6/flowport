"use client";
import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function OptimizePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [resolved, setResolved] = useState(new Set());
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | high | medium | low
  const [useSlither, setUseSlither] = useState(false);
  const [sortBy, setSortBy] = useState('priority'); // priority | title
  const [useProjectScan, setUseProjectScan] = useState(false);
  const [projectDir, setProjectDir] = useState('');
  const [activeIdx, setActiveIdx] = useState(null);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({ high: false, medium: false, low: false });
  const [diag, setDiag] = useState([]);
  const [snippet, setSnippet] = useState('');
  const [editorInst, setEditorInst] = useState(null);
  const [monacoInst, setMonacoInst] = useState(null);
  const runScanRef = React.useRef(() => {});

  // Persist core UI state to localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('optimize_ui') || '{}');
      if (typeof saved.code === 'string') setCode(saved.code);
      if (typeof saved.useSlither === 'boolean') setUseSlither(saved.useSlither);
      if (typeof saved.filter === 'string') setFilter(saved.filter);
      if (typeof saved.sortBy === 'string') setSortBy(saved.sortBy);
      if (typeof saved.search === 'string') setSearch(saved.search);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('optimize_ui', JSON.stringify({ code, useSlither, filter, sortBy, search }));
    } catch {}
  }, [code, useSlither, filter, sortBy, search]);

  // Toast helper
  function showToast(message) {
    try {
      const el = document.createElement('div');
      el.textContent = message;
      el.setAttribute('role', 'status');
      el.style.position = 'fixed';
      el.style.bottom = '16px';
      el.style.right = '16px';
      el.style.background = 'rgba(15,23,42,0.9)';
      el.style.border = '1px solid rgba(255,255,255,0.15)';
      el.style.color = '#bfdbfe';
      el.style.padding = '8px 12px';
      el.style.borderRadius = '8px';
      el.style.fontSize = '12px';
      el.style.zIndex = '9999';
      el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.35)';
      document.body.appendChild(el);
      setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 300ms'; }, 1800);
      setTimeout(() => { el.remove(); }, 2200);
    } catch {}
  }

  const runScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(useProjectScan ? { projectDir, slither: useSlither } : { code, slither: useSlither, withDiagnostics: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setResults(data.suggestions);
        setMetrics(data.metrics);
        setResolved(new Set());
        setDiag(data.diagnostics || []);
        showToast('Scan complete');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
      showToast('Scan failed');
    } finally {
      setLoading(false);
    }
  };
  runScanRef.current = runScan;

  // Keyboard shortcut: Cmd/Ctrl+Enter to scan
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!loading) runScanRef.current();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loading]);

  useEffect(() => {
    if (!editorInst || !monacoInst) return;
    try {
      const model = editorInst.getModel();
      if (!model) return;
      const markers = (diag || []).map((d) => ({
        startLineNumber: Number(d.line) || 1,
        startColumn: Number(d.column) || 1,
        endLineNumber: Number(d.line) || 1,
        endColumn: (Number(d.column) || 1) + 1,
        message: String(d.message || 'Issue'),
        severity: monacoInst.MarkerSeverity?.Warning || 2,
      }));
      monacoInst.editor.setModelMarkers(model, 'solhint', markers);
    } catch {}
  }, [diag, editorInst, monacoInst]);

  const coveragePercent = useMemo(() => {
    if (!results || results.length === 0) return 0;
    return Math.round((resolved.size / results.length) * 100);
  }, [resolved, results]);

  const toggleResolved = (idx) => {
    setResolved((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  function _priorityRank(p) {
    if (p === 'high') return 0;
    if (p === 'medium') return 1;
    if (p === 'low') return 2;
    return 3;
  }

  function renderGroupedList({ items, filter, sortBy, search, collapsed, setCollapsed, resolved, toggleResolved, activeIdx, setActiveIdx }) {
    const groups = { high: [], medium: [], low: [] };
    const filtered = (items || [])
      .filter((s) => (filter === 'all' || s.priority === filter))
      .filter((s) => !search || (s.title?.toLowerCase()?.includes(search.toLowerCase()) || s.description?.toLowerCase()?.includes(search.toLowerCase())));
    filtered.forEach((s, i) => {
      (groups[s.priority] || groups.low).push({ s, i });
    });
    const order = ['high', 'medium', 'low'];
    const any = order.some((lvl) => (groups[lvl] || []).length > 0);
    return (
      <div className="space-y-4">
        {!any && (
          <div className="text-blue-300 text-sm bg-black/30 border border-white/10 rounded p-3">
            No suggestions match your filters. Try adjusting search or severity.
          </div>
        )}
        {order.map((level) => (
          <div key={level} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-blue-200 font-semibold capitalize flex items-center gap-2">
                <span>{level} Priority</span>
                <Badge tone="info">{groups[level]?.length || 0}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCollapsed((c) => ({ ...c, [level]: !c[level] }))}>{collapsed[level] ? 'Expand' : 'Collapse'}</Button>
            </div>
            {!collapsed[level] && (
              <ul className="space-y-2">
                {groups[level]
                  .sort((a, b) => sortBy === 'title' ? String(a.s.title).localeCompare(String(b.s.title)) : 0)
                  .map(({ s, i }) => (
                    <li key={i} className={`bg-slate-800/60 p-4 rounded-md border border-white/10 flex items-start gap-3 ${resolved.has(i) ? 'opacity-40 line-through' : ''}`}>
                      <input type="checkbox" className="mt-1 accent-green-500" checked={resolved.has(i)} onChange={() => toggleResolved(i)} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-blue-100 font-medium">{s.title}</p>
                          <div className="flex items-center gap-2">
                            <Badge tone={s.priority === 'high' ? 'danger' : s.priority === 'medium' ? 'warning' : 'success'}>{s.priority}</Badge>
                            {s.source && <Badge tone="info">{s.source}</Badge>}
                          </div>
                        </div>
                        <p className="text-blue-300 text-sm mt-1">{s.description}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <Button variant="secondary" size="sm" onClick={() => setActiveIdx(activeIdx === i ? null : i)} aria-label="Toggle details">{activeIdx === i ? 'Hide details' : 'Details'}</Button>
                          <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(s.implementation || s.recommendation || s.description); showToast('Copied fix'); }} aria-label="Copy fix">Copy fix</Button>
                        </div>
                        {activeIdx === i && (
                          <div className="mt-3 bg-black/30 border border-white/10 rounded p-3 text-xs text-blue-200 space-y-2">
                            {s.recommendation && (
                              <div>
                                <div className="text-blue-100 font-medium mb-1">Recommendation</div>
                                <div className="whitespace-pre-wrap">{s.recommendation}</div>
                              </div>
                            )}
                            {s.implementation && (
                              <div>
                                <div className="text-blue-100 font-medium mb-1">Implementation</div>
                                <pre className="bg-black/40 p-2 rounded border border-white/10 overflow-auto"><code>{s.implementation}</code></pre>
                                {!useProjectScan && (
                                  <div className="mt-2">
                                    <Button variant="secondary" size="sm" onClick={()=> { setCode((c)=> (c ? c + '\n\n' + (s.implementation || '') : (s.implementation || ''))); showToast('Applied to editor'); }} aria-label="Apply to editor">
                                      Apply to editor
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }

  function exportReport(kind, data) {
    const blob = new Blob([
      kind === 'json' ? JSON.stringify(data, null, 2) :
      `<!doctype html><meta charset="utf-8"><title>Optimizer Report</title><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`
    ], { type: kind === 'json' ? 'application/json' : 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimizer-report.${kind}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function copyAllFixes() {
    try {
      const items = Array.isArray(results) ? results : [];
      const payload = items
        .map((s, i) => {
          const body = s.implementation || s.recommendation || s.description || '';
          return `// Suggestion #${i + 1}: ${s.title || ''}\n${body}`.trim();
        })
        .filter(Boolean)
        .join('\n\n/* ---------------- */\n\n');
      if (payload) navigator.clipboard?.writeText(payload);
    } catch {}
  }

  function applyAllFixesToEditor() {
    if (useProjectScan) return;
    try {
      const items = Array.isArray(results) ? results : [];
      const bodies = items.map((s) => s.implementation || s.recommendation || '').filter(Boolean);
      if (!bodies.length) return;
      const joined = bodies.join('\n\n/* ---------------- */\n\n');
      setCode((c) => (c ? c + '\n\n' + joined : joined));
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-blue-950 flex items-center justify-center p-8">
      <div className="bg-white/10 border border-white/20 rounded-xl p-8 max-w-2xl w-full space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-white text-center">Optimization Scanner</h1>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-blue-200 text-sm flex items-center gap-2">
              <input type="checkbox" className="accent-blue-500" checked={useProjectScan} onChange={(e) => setUseProjectScan(e.target.checked)} />
              Project scan (run Slither on a directory)
            </label>
            {useProjectScan && (
              <input
                type="text"
                className="flex-1 bg-black/40 text-blue-100 border border-blue-800 rounded px-2 py-1 text-sm"
                placeholder="/absolute/path/to/project"
                value={projectDir}
                onChange={(e) => setProjectDir(e.target.value)}
              />
            )}
          </div>
          {metrics && (
            <div className="text-xs text-blue-100 bg-white/5 border border-white/10 rounded px-3 py-2 flex items-center gap-3">
              <span>Total: <span className="text-blue-300">{metrics.total}</span></span>
              <span>High: <span className="text-red-300">{metrics.high}</span></span>
              <span>Medium: <span className="text-amber-300">{metrics.medium}</span></span>
              <span>Low: <span className="text-emerald-300">{metrics.low}</span></span>
              <span className="ml-2">Gas: <span className="text-blue-300">{metrics.totalGasSavings?.toLocaleString?.() || metrics.totalGasSavings} gas</span></span>
              <span className="ml-auto">Coverage: <span className="text-green-300">{coveragePercent}%</span></span>
            </div>
          )}
          {!useProjectScan && (
            <div className="h-64 border border-blue-800 rounded-md overflow-hidden">
              <MonacoEditor
                height="100%"
                defaultLanguage="sol"
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v || '')}
                options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', formatOnPaste: true, formatOnType: true }}
                onValidate={()=>{}}
                onMount={(editor, monaco) => { setEditorInst(editor); setMonacoInst(monaco); }}
              />
            </div>
          )}
          {useProjectScan && (
            <p className="text-xs text-blue-300">Note: path must be absolute on the server host (e.g., /Users/mac/flowport).</p>
          )}
          {!useProjectScan && (
            <div className="flex items-center gap-2">
              <select aria-label="Insert snippet" className="bg-black/40 text-blue-100 border border-blue-800 rounded px-2 py-1 text-sm" value={snippet} onChange={(e)=>setSnippet(e.target.value)}>
                <option value="">Insert snippet…</option>
                <option value={`// Use calldata for memory arrays\nfunction process(uint256[] calldata xs) external view returns(uint256){ return xs.length; }`}>Calldata pattern</option>
                <option value={`// Packed struct example\nstruct Packed { uint128 a; uint128 b; } \nPacked public packed;`}>Storage packing</option>
                <option value={`// Safe call pattern\n(bool ok, ) = recipient.call{value: amount}(""); require(ok, "Transfer failed");`}>Safe call</option>
              </select>
              <Button variant="secondary" size="sm" onClick={()=>{ if (snippet) { setCode((c)=> (c ? c + '\n\n' + snippet : snippet)); showToast('Snippet inserted'); } }} aria-label="Apply snippet">Apply patch</Button>
            </div>
          )}
        </div>

        <Button
          disabled={loading || (!useProjectScan && !code.trim()) || (useProjectScan && !projectDir.trim())}
          onClick={runScan}
          className="w-full"
        >
          {loading ? 'Scanning...' : useProjectScan ? 'Run Project Scan' : 'Run Scan'}
        </Button>

        {error && <p className="text-red-400 text-center text-sm">{error}</p>}

        {results && (
          <div className="space-y-6">
            {metrics && (
              <div className="space-y-2">
                {diag && diag.length > 0 && (
                  <div className="mt-2 bg-black/30 border border-white/10 rounded p-2">
                    <div className="text-xs text-blue-200 mb-1">Diagnostics ({diag.length})</div>
                    <ul className="text-[11px] text-blue-300 space-y-1 max-h-28 overflow-auto">
                      {diag.slice(0,10).map((d,i)=> (
                        <li key={i} className="font-mono truncate">{d.message} @ {d.line}:{d.column}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-500 h-3"
                    style={{ width: `${coveragePercent}%` }}
                  />
                </div>
                <p className="text-xs text-blue-200 text-right">Coverage: {coveragePercent}% ({resolved.size}/{results.length})</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-300">
                  <p>Total: {metrics.total}</p>
                  <p>High: {metrics.high}</p>
                  <p>Medium: {metrics.medium}</p>
                  <p>Low: {metrics.low}</p>
                  <p className="col-span-2">Est. Gas Savings: {metrics.totalGasSavings.toLocaleString()} gas</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 sticky top-0 bg-white/5 backdrop-blur rounded px-2 py-2 border border-white/10 z-10">
              <h2 className="text-xl text-blue-200 font-semibold">Suggestions</h2>
              <div className="flex items-center gap-2">
                <label className="text-blue-200 text-sm flex items-center gap-1">
                  <input type="checkbox" className="accent-blue-500" checked={useSlither} onChange={(e) => setUseSlither(e.target.checked)} aria-label="Use Slither" />
                  Slither
                </label>
                <input
                  type="text"
                  placeholder="Search…"
                  className="bg-black/40 text-blue-100 border border-blue-800 rounded px-2 py-1 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search suggestions"
                />
                <select
                  className="bg-black/40 text-blue-100 border border-blue-800 rounded px-2 py-1 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort suggestions"
                >
                  <option value="priority">Sort: Priority</option>
                  <option value="title">Sort: Title</option>
                </select>
                <select
                  className="bg-black/40 text-blue-100 border border-blue-800 rounded px-2 py-1 text-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label="Filter severity"
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearch(''); setFilter('all'); setSortBy('priority'); setCollapsed({ high: false, medium: false, low: false }); showToast('Filters reset'); }}
                  aria-label="Reset filters"
                >Reset</Button>
                <Button variant="secondary" size="sm" onClick={() => { copyAllFixes(); showToast('All fixes copied'); }} aria-label="Copy all fixes">Copy all fixes</Button>
                <Button variant="secondary" size="sm" disabled={useProjectScan} onClick={() => { applyAllFixesToEditor(); showToast('All fixes applied'); }} aria-label="Apply all fixes">Apply all fixes</Button>
                <Button variant="secondary" size="sm" onClick={() => { exportReport('json', { metrics, suggestions: results }); showToast('Exported JSON'); }} aria-label="Export JSON">Export JSON</Button>
                <Button variant="secondary" size="sm" onClick={() => { exportReport('html', { metrics, suggestions: results }); showToast('Exported HTML'); }} aria-label="Export HTML">Export HTML</Button>
              </div>
            </div>
            {renderGroupedList({
              items: results,
              filter,
              sortBy,
              search,
              collapsed,
              setCollapsed,
              resolved,
              toggleResolved,
              activeIdx,
              setActiveIdx,
            })}
          </div>
        )}
      </div>
    </div>
  );
}
