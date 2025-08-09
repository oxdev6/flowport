## FlowPort CLI (Milestone 1)

FlowPort is a CLI designed to power database/application migrations and system visualization. Milestone 1 establishes the CLI skeleton with placeholder commands and developer setup.

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

### Planned Functionality

- Migrations: robust migration execution, status tracking, dry-runs, and rollback.
- Visualization: generate visual maps/graphs of data flows and dependencies.
- Config: project-level configuration for targets, environments, and outputs.

### Development

- Entry point: `src/index.js`
- Commands will be organized under `src/commands/` in future milestones.

### License

ISC


