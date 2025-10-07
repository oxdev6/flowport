## Arbitrum Migration Portal

Arbitrum Migration Portal is a comprehensive toolchain for migrating contracts from Ethereum to Arbitrum. The project focuses on providing professional migration tools, analysis, and optimization for the Arbitrum ecosystem.

### Installation

Prerequisites: Node.js 18+ and npm.

1. Install dependencies:

```bash
npm install
```

2. Link globally for local development:

```bash
npm link
```

You can now run `arb-migrate` from anywhere.

### Usage

- Version:

```bash
arb-migrate --version
```

- Help:

```bash
arb-migrate --help
```

- Analyze Contract:

```bash
arb-migrate analyze 0x1234... --output all
```

- Deploy to Arbitrum:

```bash
arb-migrate deploy --network arbitrumSepolia
```

- Start Dashboard:

```bash
arb-migrate dashboard --port 3000
```

### Environment variables

- **ETH_RPC_URL**: Ethereum L1 RPC URL (used for L1 operations)
- **SEPOLIA_RPC_URL**: Ethereum Sepolia RPC URL (alias for ETH Sepolia)
- **ARB_RPC_URL**: Arbitrum Sepolia RPC URL
- **ARBITRUM_ONE_RPC_URL** or **ARBITRUM_RPC_URL**: Arbitrum One mainnet RPC URL. Example:

```bash
ARBITRUM_ONE_RPC_URL=https://arbitrum.llamarpc.com
# or
ARBITRUM_RPC_URL=https://arbitrum.llamarpc.com
```

### Exporting contract state

You can export a contract's raw storage and optionally decode mappings when you provide keys:

```bash
# Raw storage (requires a node supporting debug_storageRangeAt; falls back to empty when unavailable)
arb-migrate dump-state --address 0xYourContract --rpc $ARBITRUM_ONE_RPC_URL --block latest --out ./reports/state.json

# Decode specific mappings (flat)
arb-migrate dump-state \
  --address 0xYourContract \
  --rpc $ARBITRUM_ONE_RPC_URL \
  --mapping-spec '{"mappings":[{"name":"balances","slot":3,"keyType":"address","keys":["0xabc...","0xdef..."]}]}'

# Decode nested mappings with provided keys
arb-migrate dump-state \
  --address 0xYourContract \
  --rpc $ARBITRUM_ONE_RPC_URL \
  --mapping-spec '{"mappings":[{"name":"allowance","slot":5,"keyTypes":["address","address"],"keys":[["0xowner", ["0xspender1","0xspender2"]]]}]}'
```

Notes:
- EVM mappings are not enumerable; full dumps require you to supply keys or rely on application-level indexes/events. When keys are provided, values are read via computed storage slots.
- Raw storage export uses `debug_storageRangeAt` when available to page through slots; some public RPCs disable this method.

### Inferring mapping keys from logs (helper)

When you do not have the full set of mapping keys (e.g., ERC20 `balances`), you can derive candidate addresses from on-chain logs, generate a mapping-spec JSON, and optionally run a state dump with it.

```bash
# Generate keys from Transfer logs and write mapping-spec
arb-migrate extract-keys \
  --address 0xYourToken \
  --rpc $ARBITRUM_ONE_RPC_URL \
  --standard erc20-balances \
  --slot 3 \
  --start-block 0 \
  --end-block latest \
  --out-spec ./reports/balances.mapping.json

# Optionally, run dump-state immediately using generated keys
arb-migrate extract-keys \
  --address 0xYourToken \
  --rpc $ARBITRUM_ONE_RPC_URL \
  --standard erc20-balances \
  --slot 3 \
  --run-dump \
  --dump-block latest \
  --page-size 1024 \
  --out-spec ./reports/balances.mapping.json > ./reports/state-with-balances.json
```

Options:
- `--standard`: `erc20-balances` (default), `erc20-allowance`, `erc721-owners`, or `events-any` (collect indexed addresses from all events).
- `--emitter`: if events are emitted by a proxy/other address, set this; defaults to `--address`.
- `--slot`: base storage slot for the mapping (required).

### Documentation

- Enhanced Milestone 2 Specification: `docs/milestone-2-enhanced-specification.md`
- Milestone 2 Summary: `docs/milestone-2-enhanced-summary.md`
- Milestone 1 Research & Architecture: `docs/milestone-1-research.md`

### Milestone 2 — Migration Tool (Scaffold)

- CLI: `arb-migrate` with commands: `init`, `node`, `deploy`, `verify`, `balance`, `test-local`, `auto-deploy`
- Contracts: example `contracts/Counter.sol`
- Scripts: `scripts/deploy.js`
- SDK: `src/sdk` exposes helpers: deploy, balance, records, verify
- Config: `hardhat.config.js`, `migration/config.example.json`, `.env.example`
- Usage examples:

```bash
arb-migrate init
# Deploy to Arbitrum Sepolia (requires funded PRIVATE_KEY):
arb-migrate deploy --network arbitrumSepolia
# Or run locally (spawns hardhat localhost; can fork ARB_RPC_URL if provided):
arb-migrate deploy --local
# Deploy multiple from config:
arb-migrate deploy --network arbitrumSepolia --config migration/config.example.json
# Start a local Hardhat node (separate terminal):
arb-migrate node --hostname 127.0.0.1 --port 8545
arb-migrate verify --network arbitrumSepolia --address 0x...
# Validate environment:
node -e "require('./src/utils/env').printEnvReport({requirePrivateKey:true})"
# Auto-deploy when funds arrive:
arb-migrate auto-deploy --network arbitrumSepolia --interval 20
# Plan costs from config:
arb-migrate plan --network arbitrumSepolia --config migration/config.example.json
# Validate config against schema:
arb-migrate validate-config --config migration/config.example.json
# Verify all from deployment records:
arb-migrate verify-all --network arbitrumSepolia
# Replay transactions from Sepolia to Arbitrum Sepolia:
arb-migrate replay --from 0x06395a32ba4c6a468D35E451cbf93b0f07da902b --blocks 10 --dry-run
arb-migrate replay --from 0x06395a32ba4c6a468D35E451cbf93b0f07da902b --blocks 5 --json
# Test replay locally (no external RPC required):
arb-migrate replay --local --json
# Start the web dashboard:
arb-migrate dashboard --port 3000
```

### Config Schema

- Schema: `migration/config.schema.json`
- Example: `migration/config.example.json`

### Enhanced Milestone 2 Features

- **One-Click Deploy**: Web UI + CLI for maximum accessibility
- **Pre-Migration Reports**: Professional analysis and transparency
- **Cross-Network Replay**: Real-time migration visualization
- **Security Scanner**: Arbitrum-specific optimization detection
- **DAO Metrics**: Live dashboard for ecosystem impact tracking
- **Partner Demos**: Real-world case studies for marketing
- **AI Migration Copilot**: Inline contract analysis & optimization suggestions with percentage coverage tracking
- Config: project-level configuration for targets, environments, and outputs

### Web Dashboard

The FlowPort dashboard provides a visual interface for monitoring migration results:

- **Migration Stats**: Overview of deployments, replays, gas usage, and success rates
- **Transaction Charts**: Visual representation of gas usage over time
- **Deployment Table**: Detailed view of all contract deployments with links to Arbiscan
- **Replay Results**: Status and details of transaction replay operations

Access the dashboard by running:
```bash
arb-migrate dashboard --port 3000
```

Then open http://localhost:3000 in your browser.

### AI Migration Copilot (Optimizer)

The Optimizer tab provides on-the-fly contract analysis. Paste Solidity source and receive categorized suggestions plus an interactive coverage bar.

Run locally:

```bash
# Dev server with hot-reload
npm run dev
# navigate to /optimize
```

Behind the scenes the request hits `POST /api/optimize` which calls the shared optimizer library (`src/lib/optimizer`). The same engine powers the CLI command:

```bash
arb-migrate optimize contracts/Counter.sol
arb-migrate optimize-project . --slither
```

#### Slither integration (optional)

You can augment results with Slither findings when Slither is available or when you explicitly enable it.

Install on macOS:

```bash
# via pipx (recommended)
brew install pipx
pipx install slither-analyzer --include-deps
# ensure ~/.local/bin is on PATH for future shells
pipx ensurepath
# install solc (required by slither)
brew install solidity
```

Usage:

```bash
# CLI
SLITHER_ENABLED=1 npx arb-migrate optimize contracts/Counter.sol
SLITHER_ENABLED=1 npx arb-migrate optimize-project .

# Web UI (dev server)
SLITHER_ENABLED=1 npm run dev
# open /optimize and run a scan
# You can also POST a project directory to the API:
# curl -X POST /api/optimize -d '{"projectDir":"/absolute/path"}'

Security note: projectDir scans are disabled in production builds and intended for local development only.
```

Notes:
- If `SLITHER_ENABLED` is unset, the optimizer auto-detects Slither and uses it when found.
- Slither findings are normalized into suggestions and merged with heuristic results.

#### Optimizer cache

Optimization results are cached by the SHA‑256 hash of the Solidity source under `.optimizer-cache/`.

- Clear cache: delete the folder `.optimizer-cache/`.
- Cache is used by both CLI and API.

### Tests

Run unit tests for the optimizer:

```bash
npm test
```

### Docker

Build and run the web app in production mode:

```bash
docker build -t flowport:latest .
docker run -p 3000:3000 flowport:latest
# open http://localhost:3000
```

---

### Visualizer MVP (Milestone 3)

Environment:

- `TRACING_PROVIDER=mock|tenderly|blockscout|debug`
- `TENDERLY_API_KEY` (if using Tenderly)
- `BLOCKSCOUT_BASE_URL` (if using Blockscout)
- `SNAPSHOT_STORAGE_DIR` (defaults to `reports/snapshots`)
- `SHARE_SIGNING_SECRET`

Docs: `docs/milestone-3-visualizer-mvp.md`

### Release Notes (v1.1.0)

- Optimizer (AI Copilot)
  - Monaco inline diagnostics from Solhint
  - Metrics mini-bar, coverage bar, sticky toolbar
  - Search/filter persistence, toasts, Cmd/Ctrl+Enter shortcut
  - Copy/Apply single fix and Copy/Apply all fixes
- Visualizer
  - Edge tooltips (ABI-aware), revert styling, center-on-selected
  - L1/L2 diff: side-by-side, synced scroll, keyboard nav, copy diff
  - Export replay (JSON/HTML), print-friendly HTML, screenshot PNG, copy link
- Deploy/Verify
  - UI polish and status improvements
- CSS
  - Safari `-webkit-backdrop-filter` fallbacks; fixed `:root` selector

Upgrade: package version bumped to 1.1.0.

### License

ISC


