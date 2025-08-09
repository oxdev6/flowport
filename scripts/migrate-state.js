const hre = require('hardhat');
const fs = require('fs');
const path = require('path');
const sdk = require('../src/sdk');

async function main() {
  const sourceRpc = process.env.SOURCE_RPC_URL || process.env.ETH_RPC_URL;
  const l1Address = process.env.L1_COUNTER_ADDRESS; // Source L1 contract address
  const network = hre.network.name;

  if (!sourceRpc || !l1Address) {
    console.error('Missing SOURCE_RPC_URL/ETH_RPC_URL or L1_COUNTER_ADDRESS');
    process.exit(1);
  }

  // Minimal ABI for reading value()
  const abi = ["function value() view returns (uint256)"];
  const l1Provider = new hre.ethers.JsonRpcProvider(sourceRpc);
  const l1 = new hre.ethers.Contract(l1Address, abi, l1Provider);
  const current = await l1.value();
  console.log('L1 value =', current.toString());

  // Find latest L2 deployment for MigratableCounter or from env
  const targetAddress = process.env.L2_COUNTER_ADDRESS || (sdk.loadDeploymentRecord(network, 'MigratableCounter')?.address);
  if (!targetAddress) {
    console.error('Missing L2_COUNTER_ADDRESS or no deployment record found for MigratableCounter');
    process.exit(1);
  }

  const MigratableCounter = await hre.ethers.getContractFactory('MigratableCounter');
  const mc = await MigratableCounter.attach(targetAddress);

  const [signer] = await hre.ethers.getSigners();
  const addr = await signer.getAddress();
  console.log('Migrating as', addr, 'to', targetAddress);

  const tx = await mc.setValue(current);
  await tx.wait();
  console.log('L2 value set to', (await mc.value()).toString());
}

main().catch((e) => { console.error(e); process.exit(1); });


