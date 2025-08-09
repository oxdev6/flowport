# Milestone 1 — Research & Architecture Design

This document summarizes findings and decisions for Ethereum → Arbitrum migration and the initial architecture for FlowPort’s Migration + Visualization platform.

## Summary of Ethereum → Arbitrum Migration Requirements

- Smart contract deployment on Arbitrum (Nitro EVM). Re-deploy contracts with identical or compatible ABIs and storage layouts. Proxies recommended for upgradeability.
- State migration strategy. Decide whether to migrate historical state (e.g., mappings, balances) or initialize a fresh state snapshot and replay only critical state transitions.
- Cross-chain messaging. Use L1↔L2 messaging (retryable tickets, outbox/inbox) for asset/state bridging and provenance proofs.
- Wallet/account compatibility. Same addresses/keys can be reused; chainId differs. Nonces, balances, and deployments are chain-specific.
- RPC endpoints. Separate RPCs for Arbitrum networks (Arbitrum One, Nova, Sepolia). Ensure reliable providers with websockets for indexing.
- Gas/fees. Lower fees on L2; estimation and base fee mechanics differ. Batch posting costs to L1 affect final cost. Consider calldata compression.
- Tooling/SDKs. Ethers.js for core interactions; Arbitrum SDK for retryable tickets, bridging, and proofs; Hardhat/Foundry for deployments; The Graph or custom indexers for data.
- Observability. Transaction receipts, L1<->L2 status, message confirmations, reorg handling in indexers.

## Compatibility Concerns and Mitigations

- Contract bytecode equivalence:
  - Risk: Differences when compiling with different optimizer settings or Solidity versions.
  - Mitigation: Pin compiler version and optimizer settings; verify on L2 explorer; use artifact pinning and bytecode verification.

- Storage layout differences:
  - Risk: Incompatible storage layouts can corrupt migrated state.
  - Mitigation: Use proxies with careful slot mapping; validate layouts with `storageLayout` output; create migration scripts that read L1 storage via RPC and write to L2 through initializer functions.

- Precompiles and opcodes:
  - Risk: Nitro is EVM-equivalent for most use cases, but confirm precompile availability and gas costs.
  - Mitigation: Audit dependencies on precompiles; benchmark gas on L2.

- L1↔L2 message semantics:
  - Risk: Misuse of retryable tickets can lead to stuck messages or funding issues.
  - Mitigation: Use Arbitrum SDK helpers; auto-fund retryable tickets; monitor ticket lifecycle; implement re-try logic.

- RPC variance and rate limits:
  - Risk: Event gaps or missed blocks during indexing.
  - Mitigation: Use websockets plus polling fallback; maintain last-processed block checkpoints; implement backfills and reconciliation jobs.

- Address derivation and CREATE2:
  - Risk: Contract addresses on L2 differ if salts or init code change.
  - Mitigation: Use deterministic deployments with the same salts and init code where possible; otherwise map L1→L2 addresses in a registry.

## Evaluation of Arbitrum Tooling

- Arbitrum Nitro/ArbOS: Production L2 stack with strong EVM equivalence and lower fees.
- Arbitrum SDK:
  - Retryable tickets creation/funding
  - L1↔L2 bridges and message proof utilities
  - Inbox/outbox handling
- Ecosystem:
  - Explorers: Arbiscan, Blockscout-based instances
  - Indexing: The Graph, Subsquid, custom indexers
  - Dev tooling: Hardhat plugins, Foundry, Anvil, local Nitro dev nodes

Conclusion: Use Ethers.js + Arbitrum SDK for protocol interactions; Hardhat/Foundry for compile/deploy; custom Node.js indexer for precise data needs.

## Visualization/Explorer Review

- Existing explorers (Arbiscan) offer generic transaction views but limited domain-specific flow visualization.
- Reuse where possible:
  - Base chain data via public RPCs
  - ABI/bytecode verification endpoints
  - GraphQL APIs where available
- Build from scratch:
  - Migration run timeline (batches, retries, failures)
  - Cross-chain message lifecycle visualizer
  - Contract/state mapping view (L1→L2 address registry, storage migration status)

## Chosen Approach (High-Level)

- Migration Engine (Node.js/TypeScript):
  - Inputs: L1 contract ABIs, deployment configs, state extraction rules
  - Actions: Deploy to L2, initialize state, send L1→L2 messages, verify results
  - Orchestration: Job queue (BullMQ/Redis) for retries and idempotency

- Data Indexer (Node.js):
  - Sources: Arbitrum RPC/WebSocket + (optional) The Graph
  - Stores: PostgreSQL (transactions, logs, message status, migration batches)
  - Checkpointing and backfill to ensure completeness

- Visualization Backend (Node.js/Next.js API routes):
  - Serves aggregated views for UI
  - Exposes endpoints for migration runs, message lifecycle, contract mappings

- Explorer UI (Next.js/React):
  - Transaction visualizer (sequence diagrams, DAGs)
  - Migration run dashboards and status views
  - Search across addresses, batches, messages

## Tech Stack & Frameworks

- Programming language: TypeScript
- Libraries: Ethers v6, Arbitrum SDK, Zod (runtime validation)
- Frameworks: Next.js 14 (App Router) for UI + API, Hardhat/Foundry for contracts
- Data: PostgreSQL (primary), Redis (queue), Prisma ORM
- Infra: Docker (dev), Terraform/GitHub Actions (CI/CD later)

## Data Flows (Migration + Visualization)

1. Configure migration plan (contracts, init params, state sources).
2. Migration Engine deploys contracts to Arbitrum, initializes state, and triggers necessary L1→L2 messages (retryable tickets) via Arbitrum SDK.
3. Indexer consumes Arbitrum blocks/logs, stores structured data in Postgres, and enriches with L1↔L2 message statuses.
4. Visualization Backend provides REST/GraphQL endpoints.
5. Explorer UI renders live progress and historical runs.

## Risks & Mitigations (Selected)

- Message stuck/failure: implement retry/backoff and ticket funding monitoring.
- State drift: snapshot and checksums; reconciliation jobs; on-chain assertions.
- Gas spikes or RPC instability: provider fallback pools and circuit breakers.
- Schema drift: strict migrations with Prisma; versioned APIs.

## Roadmap Toward Milestone 2 (Implementation)

- Week 1:
  - Initialize monorepo structure (apps/ui, apps/api, packages/core)
  - Set up TypeScript configs, linting, testing
  - Scaffold DB schema (Postgres) and Prisma

- Week 2:
  - Implement minimal Migration Engine (dry-run deploy + logging)
  - Implement Indexer prototype (block/log ingestion, checkpoints)
  - Basic API endpoints for runs and transactions
  - UI: minimal explorer with run list/detail views

Deliverables for Milestone 2: runnable prototype with dry-run migration, live indexing, and basic UI views.

## References

- Arbitrum docs (Nitro, retryable tickets, SDK)
- Ethers.js v6 docs
- Hardhat/Foundry toolchains


