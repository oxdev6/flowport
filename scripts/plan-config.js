const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
const chalk = require('chalk');

async function estimateDeployGas(contractName, constructorArgs, from) {
  const factory = await hre.ethers.getContractFactory(contractName);
  const txReq = await factory.getDeployTransaction(...(constructorArgs || []));
  const gas = await hre.ethers.provider.estimateGas({ ...txReq, from });
  const fee = await hre.ethers.provider.getFeeData();
  const gasPrice = fee.gasPrice ?? fee.maxFeePerGas;
  const costWei = gasPrice ? gas * gasPrice : null;
  return { gas, gasPrice, costWei };
}

async function main() {
  const jsonOut = process.env.JSON_OUT === '1';
  const configPath = process.env.FLOWPORT_CONFIG || path.join(process.cwd(), 'migration', 'config.example.json');
  if (!fs.existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const network = hre.network.name;
  const [signer] = await hre.ethers.getSigners();
  const from = await signer.getAddress();

  const results = [];
  for (const c of cfg.contracts || []) {
    try {
      const est = await estimateDeployGas(c.name, c.args || [], from);
      results.push({
        name: c.name,
        args: c.args || [],
        gas: est.gas.toString(),
        gasPrice: est.gasPrice ? est.gasPrice.toString() : null,
        costWei: est.costWei ? est.costWei.toString() : null,
        costEth: est.costWei ? hre.ethers.formatEther(est.costWei) : null
      });
    } catch (e) {
      results.push({ name: c.name, error: e.message || String(e) });
    }
  }

  if (jsonOut) {
    console.log(JSON.stringify({ network, from, results }, null, 2));
  } else {
    console.log(chalk.cyan(`Plan for network ${network}, deployer ${from}`));
    for (const r of results) {
      if (r.error) {
        console.log(chalk.red(`- ${r.name}: ERROR ${r.error}`));
        continue;
      }
      console.log(`- ${r.name}: gas=${r.gas} gasPrice=${r.gasPrice ?? 'n/a'} cost≈${r.costEth ?? 'n/a'} ETH`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


