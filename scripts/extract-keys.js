#!/usr/bin/env node
import { ethers } from 'ethers';
import fs from 'fs';
import { Command } from 'commander';

const program = new Command();

program
  .name('extract-keys')
  .description('Extract unique address keys for mappings by scanning Transfer-style events')
  .requiredOption('--address <addr>', 'Contract address to scan')
  .option('--rpc <url>', 'RPC URL', process.env.ETH_RPC_URL || process.env.ARB_RPC_URL || process.env.ETH_SEPOLIA_RPC || '')
  .option('--event <sig>', 'Event signature (default: Transfer(address,address,uint256))', 'Transfer(address,address,uint256)')
  .option('--from <block>', 'From block number', '0')
  .option('--to <block>', 'To block number (default: latest)', 'latest')
  .option('--batch <n>', 'Block batch size', '2000')
  .requiredOption('--out <file>', 'Output JSON file with unique keys');

program.parse(process.argv);

async function main() {
  const opts = program.opts();
  const rpc = opts.rpc;
  if (!rpc) {
    console.error('Missing --rpc or ETH_RPC_URL env');
    process.exit(1);
  }
  const provider = new ethers.JsonRpcProvider(rpc);
  const iface = new ethers.Interface([`event ${opts.event}`]);
  const topic0 = iface.getEventTopic(iface.getEvent(opts.event.split('(')[0]));
  const fromBlock = opts.from === 'latest' ? await provider.getBlockNumber() : parseInt(opts.from, 10);
  const toBlock = opts.to === 'latest' ? await provider.getBlockNumber() : parseInt(opts.to, 10);
  const step = parseInt(opts.batch, 10);
  const unique = new Set();

  for (let start = fromBlock; start <= toBlock; start += step) {
    const end = Math.min(start + step - 1, toBlock);
    const logs = await provider.getLogs({ address: opts.address, fromBlock: start, toBlock: end, topics: [topic0] });
    for (const log of logs) {
      try {
        const parsed = iface.parseLog(log);
        for (const arg of parsed.args) {
          if (ethers.isAddress(arg)) unique.add(arg.toLowerCase());
        }
      } catch {}
    }
    process.stdout.write(`Scanned blocks ${start}-${end} (keys: ${unique.size})\r`);
  }
  fs.writeFileSync(opts.out, JSON.stringify(Array.from(unique), null, 2));
  console.log(`\nWrote ${unique.size} keys to ${opts.out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
