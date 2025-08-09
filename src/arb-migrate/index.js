#!/usr/bin/env node
const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

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
  .action(async (opts) => {
    try {
      const { spawn } = require('child_process');
      const args = ['hardhat', 'run', 'scripts/deploy.js'];
      const env = { ...process.env };
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
      const hre = require('hardhat');
      // Hardhat only reads network via env/cmd flags; spawn a sub-process
      const { spawn } = require('child_process');
      const script = `
        const hre = require('hardhat');
        (async () => {
          const [s] = await hre.ethers.getSigners();
          const addr = await s.getAddress();
          const bal = await hre.ethers.provider.getBalance(addr);
          console.log(addr, require('ethers').formatEther(bal));
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
  .command('verify')
  .description('Verify deployed contracts on Arbiscan (if enabled)')
  .option('--network <name>', 'Network name', 'arbitrumSepolia')
  .option('--address <addr>', 'Contract address to verify')
  .option('--constructor-args <args>', 'JSON array of constructor args', '[]')
  .action(async (opts) => {
    const { spawn } = require('child_process');
    const args = JSON.parse(opts.constructorArgs);
    const cmd = ['hardhat', 'verify', '--network', opts.network, opts.address, ...args.map(String)];
    const hh = spawn('npx', cmd, { stdio: 'inherit' });
    hh.on('exit', (code) => process.exit(code ?? 0));
  });

program.parse(process.argv);


