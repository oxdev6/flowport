## FlowPort

FlowPort is a toolchain for chain migrations and visualization. The CLI skeleton exists for future milestones, while Milestone 1 focuses on research and architecture design for Ethereum → Arbitrum migrations and the visualization system.

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

You can now run `flowport` from anywhere.

### Usage

- Version:

```bash
flowport --version
```

- Help:

```bash
flowport --help
```

- Migration (placeholder):

```bash
flowport migrate
# Output:
# Migration command placeholder - coming soon!
```

- Visualization (placeholder):

```bash
flowport visualize
# Output:
# Visualization command placeholder - coming soon!
```

### Documentation

- Milestone 1 Research & Architecture: `docs/milestone-1-research.md`
- Architecture Diagram (Mermaid): `docs/architecture-diagram.mmd`

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
```

### Config Schema

- Schema: `migration/config.schema.json`
- Example: `migration/config.example.json`

### Planned Functionality

- Migrations: robust migration execution, status tracking, dry-runs, and rollback
- Visualization: generate visual maps/graphs of data flows and dependencies
- Config: project-level configuration for targets, environments, and outputs

### License

ISC


