#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import fs, { rmSync } from 'fs';
import chalk from 'chalk';
import { printEnvReport } from '../utils/env.js';
import { spawn } from 'child_process';
import { analyzeContract } from './commands/analyze.js';
import { optimizeContract } from './commands/optimize.js';
import { benchmarkContract } from './commands/benchmark.js';
import { optimizeProject } from './commands/optimizeProject.js';
import { loadOrbitConfig } from '../utils/orbit.js';
import { dumpState as dumpStateLib } from '../lib/storage/dump.js';

const program = new Command();

program
  .name('arb-migrate')
  .description('Arbitrum migration CLI')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize migration config and .env example')
  .action(() => {
    const envPath = path.resolve(process.cwd(), '.env.example');
    const configDir = path.resolve(process.cwd(), 'migration');
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    const configPath = path.join(configDir, 'config.example.json');

    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, [
        'PRIVATE_KEY=0xYOUR_PRIVATE_KEY',
        'ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY',
        'ARB_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY',
        'ARBITRUM_ONE_RPC_URL=https://arbitrum.llamarpc.com',
        ''
      ].join('\n'));
      console.log(chalk.green('Created .env.example'));
    } else {
      console.log(chalk.yellow('.env.example already exists'));
    }

    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify({
        contracts: [
          { name: 'Counter', path: 'contracts/Counter.sol', args: [] }
        ],
        verify: true
      }, null, 2));
      console.log(chalk.green('Created migration/config.example.json'));
    } else {
      console.log(chalk.yellow('migration/config.example.json already exists'));
    }
  });

program
  .command('deploy')
  .description('Compile and deploy contracts to Arbitrum testnet')
  .option('--network <name>', 'Network name in hardhat.config.js', 'arbitrumSepolia')
  .option('--local', 'Deploy to local hardhat node (with optional Arbitrum Sepolia forking)')
  .option('--config <path>', 'Path to migration config (JSON) to deploy multiple contracts')
  .option('--orbit-config <path>', 'Path to Orbit chain config JSON (name,rpcUrl,chainId)')
  .option('--dry-run', 'Do not send transactions; estimate gas/costs only')
  .option('--json', 'Output JSON with deployed address/tx (when not dry-run)')
  .action(async (opts) => {
    try {
      // Validate env early when not local
      if (!opts.local) {
        printEnvReport({ requirePrivateKey: true });
      }
      // Dry-run: use planner instead of real deploy
      if (opts.dryRun) {
        const env = { ...process.env };
        if (opts.config) env.ARB_MIGRATE_CONFIG = opts.config;
        const args = ['hardhat', 'run', 'scripts/plan-config.js'];
        if (!opts.local) args.push('--network', opts.network);
        const hh = spawn('npx', args, { stdio: 'inherit', env });
        hh.on('exit', (code) => process.exit(code ?? 0));
        return;
      }
      const args = ['hardhat', 'run'];
      if (opts.config) {
        args.push('scripts/deploy-config.js');
      } else {
        args.push('scripts/deploy.js');
      }
      const env = { ...process.env };
      if (opts.orbitConfig) env.ORBIT_CONFIG = opts.orbitConfig;
      if (opts.config) env.ARB_MIGRATE_CONFIG = opts.config;
      if (opts.json) env.JSON_OUT = '1';
      if (opts.local) {
        // run against local hardhat network
        env.HARDHAT_NETWORK = 'localhost';
      } else {
        args.push('--network', opts.network);
      }
      const hh = spawn('npx', args, { stdio: 'inherit', env });
      hh.on('exit', (code) => process.exit(code ?? 0));
    } catch (err) {
      console.error(chalk.red('Deployment failed:'), err);
      process.exit(1);
    }
  });

program
  .command('balance')
  .description('Show deployer balance on configured network')
  .option('--network <name>', 'Network name in hardhat.config.js', 'arbitrumSepolia')
  .action(async (opts) => {
    try {
      // Hardhat only reads network via env/cmd flags; spawn a sub-process
      const script = `
        const hre = await import('hardhat');
        const { ethers } = await import('ethers');
        (async () => {
          const [s] = await hre.default.ethers.getSigners();
          const addr = await s.getAddress();
          const bal = await hre.default.ethers.provider.getBalance(addr);
          console.log(addr, ethers.formatEther(bal));
        })().catch(e=>{console.error(e); process.exit(1)});
      `;
      const node = spawn('node', ['-e', script], { stdio: 'inherit', env: { ...process.env, HARDHAT_NETWORK: opts.network } });
      node.on('exit', (code) => process.exit(code ?? 0));
    } catch (err) {
      console.error(chalk.red('Balance check failed:'), err);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze contract for Arbitrum migration readiness')
  .argument('<address>', 'Contract address to analyze')
  .option('--output <format>', 'Output format: json, html, csv, or all', 'all')
  .option('--network <name>', 'Source network for analysis', 'ethereum')
  .action(async (address, opts) => {
    try {
      await analyzeContract(address, {
        output: opts.output,
        network: opts.network
      });
    } catch (err) {
      console.error(chalk.red('Analysis failed:'), err);
      process.exit(1);
    }
  });

program
  .command('optimize')
  .description('Optimize contract for Arbitrum deployment')
  .argument('<contract>', 'Contract file path to optimize')
  .option('--output <path>', 'Output path for optimized contract')
  .option('--level <level>', 'Optimization level: basic, advanced, or aggressive', 'advanced')
  .action(async (contract, opts) => {
    try {
      await optimizeContract(contract, {
        output: opts.output,
        level: opts.level
      });
    } catch (err) {
      console.error(chalk.red('Optimization failed:'), err);
      process.exit(1);
    }
  });

program
  .command('benchmark')
  .description('Benchmark contract performance on Ethereum vs Arbitrum')
  .argument('<contract>', 'Contract file path to benchmark')
  .option('--output <path>', 'Output path for benchmark report')
  .option('--detailed', 'Include detailed performance metrics')
  .action(async (contract, opts) => {
    try {
      await benchmarkContract(contract, {
        output: opts.output,
        detailed: opts.detailed,
        contractPath: contract
      });
    } catch (err) {
      console.error(chalk.red('Benchmark failed:'), err);
      process.exit(1);
    }
  });

program
  .command('optimize-project')
  .description('Run Slither across a project directory and print normalized findings')
  .argument('[dir]', 'Project directory (default: cwd)', '.')
  .option('--slither', 'Force-enable Slither (overrides auto-detect)')
  .option('--no-slither', 'Force-disable Slither')
  .option('--output', 'Print JSON to stdout')
  .action(async (dir, opts) => {
    try {
      await optimizeProject(dir, { slither: opts.slither, output: opts.output });
    } catch (err) {
      console.error(chalk.red('Project optimization failed:'), err);
      process.exit(1);
    }
  });

program
  .command('node')
  .description('Start a local Hardhat node on localhost:8545 (Ctrl+C to stop)')
  .option('--hostname <host>', 'Hostname to bind', '127.0.0.1')
  .option('--port <port>', 'Port to bind', '8545')
  .action(async (opts) => {
    try {
      const hh = spawn('npx', ['hardhat', 'node', '--hostname', opts.hostname, '--port', opts.port], { stdio: 'inherit' });
      hh.on('exit', (code) => process.exit(code ?? 0));
    } catch (err) {
      console.error(chalk.red('Failed to start Hardhat node:'), err);
      process.exit(1);
    }
  });

program
  .command('test-local')
  .description('Attach to the latest local deployment of Counter and test increment')
  .action(async () => {
    try {
      const script = `
        const fs = await import('fs');
        const path = await import('path');
        const hre = await import('hardhat');
        (async () => {
          const deploymentsDir = path.default.join(process.cwd(), 'migration', 'deployments');
          const file = path.default.join(deploymentsDir, 'localhost-Counter.json');
          if (!fs.default.existsSync(file)) {
            console.error('No local deployment record found. Run: arb-migrate deploy --local');
            process.exit(1);
          }
          const { address } = JSON.parse(fs.default.readFileSync(file, 'utf8'));
          const Counter = await hre.default.ethers.getContractFactory('Counter');
          const c = await Counter.attach(address);
          const before = await c.value();
          const tx = await c.increment(1);
          await tx.wait();
          const after = await c.value();
          console.log('OK: value ' + before.toString() + ' -> ' + after.toString() + ' @ ' + address);
        })().catch((e)=>{ console.error(e); process.exit(1); });
      `;
      const env = { ...process.env, HARDHAT_NETWORK: 'localhost' };
      const node = spawn('node', ['-e', script], { stdio: 'inherit', env });
      node.on('exit', (code) => process.exit(code ?? 0));
    } catch (err) {
      console.error(chalk.red('Local test failed:'), err);
      process.exit(1);
    }
  });

program
  .command('verify')
  .description('Verify deployed contracts on Arbiscan (if enabled)')
  .option('--network <name>', 'Network name', 'arbitrumSepolia')
  .option('--address <addr>', 'Contract address to verify')
  .option('--constructor-args <args>', 'JSON array of constructor args', '[]')
  .action(async (opts) => {
    const args = JSON.parse(opts.constructorArgs);
    const cmd = ['hardhat', 'verify', '--network', opts.network, opts.address, ...args.map(String)];
    const hh = spawn('npx', cmd, { stdio: 'inherit' });
    hh.on('exit', (code) => process.exit(code ?? 0));
  });

program
  .command('auto-deploy')
  .description('Poll deployer balance and auto-deploy to testnet once funded')
  .option('--network <name>', 'Network name', 'arbitrumSepolia')
  .option('--interval <sec>', 'Polling interval seconds', '20')
  .action(async (opts) => {
    const env = { ...process.env, HARDHAT_NETWORK: opts.network, INTERVAL_SEC: String(opts.interval) };
    const proc = spawn('node', ['scripts/auto-deploy.js'], { stdio: 'inherit', env });
    proc.on('exit', (code) => process.exit(code ?? 0));
  });

program
  .command('plan')
  .description('Estimate gas/costs for a config deployment on the selected network')
  .option('--network <name>', 'Network name', 'arbitrumSepolia')
  .option('--config <path>', 'Path to migration config JSON', 'migration/config.example.json')
  .option('--json', 'Output JSON only', false)
  .option('--local', 'Use local hardhat network', false)
  .action(async (opts) => {
    const env = { ...process.env, FLOWPORT_CONFIG: opts.config };
    if (opts.json) env.JSON_OUT = '1';
    if (opts.local) {
      env.HARDHAT_NETWORK = 'localhost';
    } else {
      env.HARDHAT_NETWORK = opts.network;
    }
    const args = ['hardhat', 'run', 'scripts/plan-config.js'];
    if (!opts.local) args.push('--network', opts.network);
    const proc = spawn('npx', args, { stdio: 'inherit', env });
    proc.on('exit', (code) => process.exit(code ?? 0));
  });

program
  .command('validate-config')
  .description('Validate a migration config JSON against the schema')
  .option('--config <path>', 'Path to migration config JSON', 'migration/config.example.json')
  .action(async (opts) => {
    const env = { ...process.env, FLOWPORT_CONFIG: opts.config };
    const proc = spawn('node', ['scripts/validate-config.js'], { stdio: 'inherit', env });
    proc.on('exit', (code) => process.exit(code ?? 0));
  });

program
  .command('verify-all')
  .description('Verify all contracts from deployment records for a network')
  .option('--network <name>', 'Network name', 'arbitrumSepolia')
  .action(async (opts) => {
    const env = { ...process.env, HARDHAT_NETWORK: opts.network };
    const proc = spawn('node', ['scripts/verify-all.js'], { stdio: 'inherit', env });
    proc.on('exit', (code) => process.exit(code ?? 0));
  });

program
  .command('env-check')
  .description('Validate required environment variables (.env) and print hints')
  .option('--require-key', 'Require PRIVATE_KEY to be present and valid', false)
  .action((opts) => {
    const ok = printEnvReport({ requirePrivateKey: Boolean(opts.requireKey) });
    process.exit(ok ? 0 : 1);
  });

program
  .command('clean')
  .description('Clean build artifacts, cache, and generated types')
  .action(() => {
    const toDelete = ['artifacts', 'cache', 'types'];
    for (const p of toDelete) {
      try { rmSync(path.join(process.cwd(), p), { recursive: true, force: true }); } catch {}
    }
    console.log('Cleaned artifacts, cache, and types');
  });

program
  .command('migrate-state')
  .description('Copy state (Counter.value) from L1 to L2 MigratableCounter')
  .option('--network <name>', 'Target L2 network', 'arbitrumSepolia')
  .action(async (opts) => {
    const env = { ...process.env, HARDHAT_NETWORK: opts.network };
    const proc = spawn('npx', ['hardhat', 'run', 'scripts/migrate-state.js', '--network', opts.network], { stdio: 'inherit', env });
    proc.on('exit', (code) => process.exit(code ?? 0));
  });

program
  .command('replay')
  .description('Replay transactions from Sepolia to Arbitrum Sepolia')
  .option('--from <address>', 'Source address to replay transactions from', '0x06395a32ba4c6a468D35E451cbf93b0f07da902b')
  .option('--blocks <number>', 'Number of blocks to replay (default: 10)', '10')
  .option('--start-block <number>', 'Starting block number (default: latest - blocks)')
  .option('--json', 'Output results in JSON format')
  .option('--dry-run', 'Simulate replay without sending transactions')
  .option('--local', 'Test replay functionality locally (no external RPC required)')
  .action(async (opts) => {
    try {
      const env = { 
        ...process.env, 
        REPLAY_FROM_ADDRESS: opts.from,
        REPLAY_BLOCKS: opts.blocks,
        REPLAY_START_BLOCK: opts.startBlock || '',
        REPLAY_DRY_RUN: opts.dryRun ? '1' : '0',
        REPLAY_JSON_OUT: opts.json ? '1' : '0'
      };
      
      let script = 'scripts/replay-transactions.js';
      if (opts.local) {
        script = 'scripts/test-replay-local.js';
        env.HARDHAT_NETWORK = 'localhost';
      }
      
      const proc = spawn('npx', ['hardhat', 'run', script], { stdio: 'inherit', env });
      proc.on('exit', (code) => process.exit(code ?? 0));
    } catch (err) {
      console.error(chalk.red('Replay failed:'), err);
      process.exit(1);
    }
  });

program
  .command('dashboard')
  .description('Start the Arbitrum Migration Portal web interface')
  .option('-p, --port <port>', 'Port to run the portal on', '3000')
  .option('-h, --host <host>', 'Host to run the portal on', 'localhost')
  .action(async (opts) => {
    console.log(`🚀 Starting Arbitrum Migration Portal on http://${opts.host}:${opts.port}`);
    console.log('Press Ctrl+C to stop the portal');
    
    const { spawn } = await import('child_process');
    const dashboard = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      env: { ...process.env, PORT: opts.port, HOST: opts.host }
    });
    
    dashboard.on('error', (error) => {
      console.error('Failed to start portal:', error);
    });
  });

program
  .command('dump-state')
  .description('Export full storage for a contract, optionally decoding mappings by provided keys')
  .requiredOption('--address <addr>', 'Contract address')
  .option('--rpc <url>', 'RPC URL (defaults to ETH_RPC_URL/ARB_RPC_URL/ARBITRUM_ONE_RPC_URL)')
  .option('--block <tag>', 'Block tag or number (default: latest)', 'latest')
  .option('--page-size <n>', 'Max entries per storageRange page (default: 1024)', '1024')
  .option('--mapping-spec <json>', 'JSON with mapping specs and keys to decode')
  .option('--out <file>', 'Output JSON file (default: stdout)')
  .action(async (opts) => {
    try {
      const rpc = opts.rpc || process.env.ETH_RPC_URL || process.env.ARB_RPC_URL || process.env.ARBITRUM_ONE_RPC_URL || process.env.ARBITRUM_RPC_URL;
      if (!rpc) {
        console.error('Missing RPC URL. Provide --rpc or set ETH_RPC_URL/ARB_RPC_URL/ARBITRUM_ONE_RPC_URL');
        process.exit(1);
      }
      const provider = new (await import('ethers')).ethers.JsonRpcProvider(rpc);
      const mappingSpec = opts.mappingSpec ? JSON.parse(opts.mappingSpec) : undefined;
      const pageSize = parseInt(opts.pageSize || '1024', 10);
      const res = await dumpStateLib({ provider, address: opts.address, blockTag: opts.block, pageSize, mappingSpec });
      const json = JSON.stringify(res, null, 2);
      if (opts.out) {
        const fs = await import('fs');
        fs.writeFileSync(opts.out, json);
        console.log('Wrote', opts.out);
      } else {
        console.log(json);
      }
    } catch (err) {
      console.error(chalk.red('State dump failed:'), err);
      process.exit(1);
    }
  });

program.parse(process.argv);


