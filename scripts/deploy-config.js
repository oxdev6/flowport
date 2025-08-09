const fs = require('fs');
const path = require('path');
const hre = require('hardhat');
const sdk = require('../src/sdk');

async function main() {
  const configPath = process.env.FLOWPORT_CONFIG || path.join(process.cwd(), 'migration', 'config.example.json');
  if (!fs.existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const network = hre.network.name;
  const deployer = await sdk.getDeployer(hre);
  const balance = await sdk.getBalance(hre, deployer);
  console.log(`Network: ${network}`);
  console.log(`Deployer: ${deployer}`);
  console.log(`Balance:  ${hre.ethers.formatEther(balance)} ETH`);

  for (const c of cfg.contracts || []) {
    console.log(`\nDeploying ${c.name} ...`);
    const contract = await sdk.deployContract(hre, c.name, c.args || []);
    const address = await contract.getAddress();
    const tx = await contract.deploymentTransaction();
    const outPath = sdk.saveDeploymentRecord(network, c.name, address, tx?.hash || null, { args: c.args || [] });
    console.log(`Deployed ${c.name} @ ${address}`);
    console.log(`Saved deployment → ${outPath}`);

    if (process.env.JSON_OUT === '1') {
      console.log(JSON.stringify({ name: c.name, address, txHash: tx?.hash || null, network, args: c.args || [] }));
    }

    if (cfg.verify && process.env.ARBISCAN_API_KEY) {
      console.log(`Verifying ${c.name} ...`);
      const code = await sdk.verifyContract(network, address, c.args || []);
      if (code !== 0) {
        console.warn(`Verify exited with code ${code}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


