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

### Visualizer MVP (Milestone 3)

Environment:

- `TRACING_PROVIDER=mock|tenderly|blockscout|debug`
- `TENDERLY_API_KEY` (if using Tenderly)
- `BLOCKSCOUT_BASE_URL` (if using Blockscout)
- `SNAPSHOT_STORAGE_DIR` (defaults to `reports/snapshots`)
- `SHARE_SIGNING_SECRET`

Docs: `docs/milestone-3-visualizer-mvp.md`

### License

ISC


