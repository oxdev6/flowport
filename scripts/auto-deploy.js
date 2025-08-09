#!/usr/bin/env node
const { spawn } = require('child_process');

async function main() {
  const intervalSec = Number(process.env.INTERVAL_SEC || 20);
  const network = process.env.HARDHAT_NETWORK || 'arbitrumSepolia';

  const hre = require('hardhat');
  const [signer] = await hre.ethers.getSigners();
  const address = await signer.getAddress();

  async function tryDeploy() {
    try {
      const bal = await hre.ethers.provider.getBalance(address);
      if (bal > 0n) {
        console.log(`Balance detected for ${address} on ${network}: ${hre.ethers.formatEther(bal)} ETH`);
        const args = ['hardhat', 'run', 'scripts/deploy.js', '--network', network];
        const proc = spawn('npx', args, { stdio: 'inherit' });
        proc.on('exit', (code) => process.exit(code ?? 0));
        return;
      }
      console.log(`No funds yet for ${address} on ${network}. Next check in ${intervalSec}s...`);
      setTimeout(tryDeploy, intervalSec * 1000);
    } catch (e) {
      console.error('Watcher error:', e?.message || e);
      setTimeout(tryDeploy, intervalSec * 1000);
    }
  }

  console.log(`Watching ${address} on ${network} every ${intervalSec}s for non-zero balance...`);
  tryDeploy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


