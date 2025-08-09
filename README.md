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

- CLI: `arb-migrate` with commands: `init`, `deploy`, `verify`
- Contracts: example `contracts/Counter.sol`
- Scripts: `scripts/deploy.js`
- Config: `hardhat.config.js`, `migration/config.example.json`, `.env.example`
- Usage examples:

```bash
arb-migrate init
# Deploy to Arbitrum Sepolia (requires funded PRIVATE_KEY):
arb-migrate deploy --network arbitrumSepolia
# Or run locally (spawns hardhat localhost; can fork ARB_RPC_URL if provided):
arb-migrate deploy --local
arb-migrate verify --network arbitrumSepolia --address 0x...
```

### Planned Functionality

- Migrations: robust migration execution, status tracking, dry-runs, and rollback
- Visualization: generate visual maps/graphs of data flows and dependencies
- Config: project-level configuration for targets, environments, and outputs

### License

ISC


