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

  const counter = await Counter.deploy(initialValue);
  await counter.waitForDeployment();
  const address = await counter.getAddress();

  console.log('Counter deployed at:', address);

  // Persist deployment info per-network for testing/verification
  try {
    const outDir = path.join(process.cwd(), 'migration', 'deployments');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `${hre.network.name}-Counter.json`);
    const tx = await counter.deploymentTransaction();
    const data = {
      network: hre.network.name,
      address,
      txHash: tx?.hash || null,
      initialValue
    };
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`Saved deployment → ${outPath}`);
  } catch (e) {
    console.warn('Warning: failed to write deployment file', e?.message || e);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


