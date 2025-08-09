const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const initialValue = Number(process.env.COUNTER_INITIAL || 0);
  console.log(`Network: ${hre.network.name}`);

  const [signer] = await hre.ethers.getSigners();
  const deployer = await signer.getAddress();
  const provider = hre.ethers.provider;

  // Preflight: check balance vs estimated deployment cost
  const Counter = await hre.ethers.getContractFactory('Counter');
  const deployTx = await Counter.getDeployTransaction(initialValue);

  const balance = await provider.getBalance(deployer);
  let gasEstimate;
  try {
    gasEstimate = await provider.estimateGas({ ...deployTx, from: deployer });
  } catch (e) {
    // If estimation fails, proceed to deploy (Hardhat will throw with a clearer error)
    gasEstimate = null;
  }

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas;

  if (gasEstimate && gasPrice) {
    const required = gasEstimate * gasPrice;
    if (balance < required) {
      const format = (wei) => hre.ethers.formatEther(wei);
      console.error(
        `Insufficient funds for deployment\n` +
          `  Deployer: ${deployer}\n` +
          `  Balance:  ${format(balance)} ETH\n` +
          `  Needed:   ~${format(required)} ETH (gas estimate)`
      );
      console.error(
        'Fund the deployer on Arbitrum Sepolia and retry. Example: arb-migrate balance --network arbitrumSepolia'
      );
      process.exit(1);
    }
  } else if (balance === 0n) {
    console.error(`Deployer ${deployer} has 0 balance. Fund it on Arbitrum Sepolia and retry.`);
    process.exit(1);
  }

  const { deployContract, saveDeploymentRecord } = require('../src/sdk');
  const counter = await deployContract(hre, 'Counter', [initialValue]);
  const address = await counter.getAddress();

  console.log('Counter deployed at:', address);

  // Persist deployment info per-network for testing/verification
  try {
    const tx = await counter.deploymentTransaction();
    const outPath = saveDeploymentRecord(hre.network.name, 'Counter', address, tx?.hash || null, { initialValue });
    console.log(`Saved deployment → ${outPath}`);
  } catch (e) {
    console.warn('Warning: failed to write deployment file', e?.message || e);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


