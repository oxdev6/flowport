## Milestone 3 — Visualizer MVP (Upgraded)

Timeline: 4 weeks | Budget: $7,000

### Outcome
An interactive transaction visualizer with replay, cross-network compare, analytics, public/private sharing, and a demo gallery—designed as Arbitrum's public-facing migration showcase.

### Features
- Interactive graph (ChainStory style): contracts → calls, token flows, gas heatmap; node click → details
- Replay mode: step-by-step timeline scrubber for transaction execution
- Public/private: private by default; shareable tokenized links; revocation supported
- Cross-network side-by-side: same tx on Ethereum Sepolia vs Arbitrum Sepolia; synchronized replay
- Visual analytics: avg gas saved, top contracts post-migration, adoption trends
- Demo gallery: curated public snapshots for marketing/showcase

### Architecture
- Next.js App Router (`app/api/*` for APIs; pages under `app/*`)
- Tracing adapters: Tenderly, Blockscout, or `debug_traceTransaction` fallback
- Data model: normalized `TxGraph` and `Snapshot` JSON
- Storage: file snapshots at `reports/snapshots/` (MVP), optional S3 later
- Security: private by default; signed token links; no index for private items

### API Surface (MVP)
- `GET /api/tx/[chainId]/[txHash]` — tx + receipt metadata
- `GET /api/trace/[chainId]/[txHash]` — raw trace frames (provider adapter)
- `GET /api/graph/[chainId]/[txHash]` — assembled `TxGraph`
- `POST /api/replay/[chainId]/[txHash]` — replay frames for timeline
- `POST /api/share/snapshot` — create snapshot (private by default)
- `GET /api/share/snapshot/[id]` — fetch snapshot (token required if private)
- `GET /api/compare/[txHash]?sourceChain=&targetChain=` — side-by-side graph + deltas
- `GET /api/analytics/metrics` — KPIs from snapshots
- `GET /api/gallery` — curated list of public snapshots

### Env
- `TRACING_PROVIDER=tenderly|blockscout|debug|mock`
- `TENDERLY_API_KEY=...`
- `BLOCKSCOUT_BASE_URL=...`
- `SHARE_SIGNING_SECRET=replace-with-strong-secret`
- `SNAPSHOT_STORAGE_DIR=reports/snapshots`

### Timeline
- Week 1: adapters + trace/graph endpoints + token flow parsing; basic GraphView
- Week 2: replay endpoint + timeline; gas heatmap; compare skeleton
- Week 3: snapshots + sharing; analytics; gallery
- Week 4: perf polish, accessibility, docs, seed demo data, deployment

### Acceptance Criteria
- Graph renders with gas heatmap and token flows for Sepolia txs
- Replay works with step controls; revert paths handled
- Public link generation with token; revocation supported
- Side-by-side synchronized replay and gas/time deltas
- Analytics dashboard with KPIs from sample snapshots
- Public gallery with 6+ curated examples

### Risks & Mitigations
- Trace availability → prefer Tenderly/Blockscout; fallback to debug
- Large traces → depth limiting, node collapsing, virtualized details
- Cross-chain alignment → signature/index-based alignment with clear fallbacks


