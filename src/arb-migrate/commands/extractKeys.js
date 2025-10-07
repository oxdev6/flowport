import chalk from 'chalk';
import { ethers } from 'ethers';
import fs from 'fs';
import { dumpState as dumpStateLib } from '../../lib/storage/dump.js';

function toChecksumAddressFromTopic(topic) {
  if (!topic || topic === '0x') return null;
  // topic is 32-byte left-padded; slice last 20 bytes
  try {
    const addr = ethers.hexDataSlice(topic, 12);
    const checksummed = ethers.getAddress(addr);
    if (checksummed === ethers.ZeroAddress) return null;
    return checksummed;
  } catch {
    return null;
  }
}

async function getBlockRange(provider, startBlockOpt, endBlockOpt) {
  const latest = await provider.getBlockNumber();
  const fromBlock = startBlockOpt != null ? Number(startBlockOpt) : 0;
  const toBlock = endBlockOpt != null && endBlockOpt !== 'latest' ? Number(endBlockOpt) : latest;
  if (Number.isNaN(fromBlock) || Number.isNaN(toBlock) || fromBlock < 0 || toBlock < fromBlock) {
    throw new Error(`Invalid block range: ${fromBlock} -> ${toBlock}`);
  }
  return { fromBlock, toBlock };
}

async function fetchLogsChunked(provider, filterBase, fromBlock, toBlock, chunkSize = 5000) {
  const logs = [];
  let start = fromBlock;
  while (start <= toBlock) {
    const end = Math.min(start + chunkSize - 1, toBlock);
    const filter = { ...filterBase, fromBlock: start, toBlock: end };
    const part = await provider.getLogs(filter);
    logs.push(...part);
    start = end + 1;
  }
  return logs;
}

export async function extractKeysAndMaybeDump({
  provider,
  contractAddress,
  targetAddress,
  standard = 'erc20-balances',
  slot,
  startBlock,
  endBlock,
  outFile,
  runDump = false,
  dumpBlock = 'latest',
  pageSize = 1024
}) {
  const address = ethers.getAddress(contractAddress);
  const emitter = targetAddress ? ethers.getAddress(targetAddress) : address;
  const { fromBlock, toBlock } = await getBlockRange(provider, startBlock, endBlock);

  const keys = new Set();

  if (standard === 'erc20-balances' || standard === 'erc721-owners') {
    const transferTopic = ethers.id('Transfer(address,address,uint256)');
    const filterBase = { address: emitter, topics: [transferTopic] };
    const logs = await fetchLogsChunked(provider, filterBase, fromBlock, toBlock);
    for (const log of logs) {
      const fromAddr = toChecksumAddressFromTopic(log.topics?.[1]);
      const toAddr = toChecksumAddressFromTopic(log.topics?.[2]);
      if (fromAddr) keys.add(fromAddr);
      if (toAddr) keys.add(toAddr);
    }
  } else if (standard === 'erc20-allowance') {
    const approvalTopic = ethers.id('Approval(address,address,uint256)');
    const filterBase = { address: emitter, topics: [approvalTopic] };
    const logs = await fetchLogsChunked(provider, filterBase, fromBlock, toBlock);
    for (const log of logs) {
      const owner = toChecksumAddressFromTopic(log.topics?.[1]);
      const spender = toChecksumAddressFromTopic(log.topics?.[2]);
      if (owner) keys.add(owner);
      if (spender) keys.add(spender);
    }
  } else if (standard === 'events-any') {
    // Fallback: collect any indexed addresses from all logs emitted by contract
    const filterBase = { address: emitter };
    const logs = await fetchLogsChunked(provider, filterBase, fromBlock, toBlock);
    for (const log of logs) {
      for (let i = 1; i < (log.topics?.length || 0); i++) {
        const a = toChecksumAddressFromTopic(log.topics[i]);
        if (a) keys.add(a);
      }
    }
  } else {
    throw new Error(`Unknown standard: ${standard}`);
  }

  const keysArray = Array.from(keys);
  console.log(chalk.green(`Found ${keysArray.length} unique addresses from logs ${fromBlock}..${toBlock}`));

  const mappingSpec = {
    mappings: [
      {
        name: standard === 'erc20-allowance' ? 'allowance' : 'balances',
        slot: Number(slot),
        keyType: 'address',
        keys: keysArray
      }
    ]
  };

  if (outFile) {
    fs.writeFileSync(outFile, JSON.stringify(mappingSpec, null, 2));
    console.log(chalk.gray(`Wrote mapping-spec to ${outFile}`));
  }

  if (runDump) {
    const res = await dumpStateLib({
      provider,
      address,
      blockTag: dumpBlock,
      pageSize,
      mappingSpec
    });
    return res;
  }

  return { mappingSpec };
}


