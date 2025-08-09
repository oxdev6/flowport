const fs = require('fs');
const path = require('path');
const sdk = require('../src/sdk');
const chalk = require('chalk');

async function main() {
  const network = process.env.HARDHAT_NETWORK || 'arbitrumSepolia';
  const dir = process.env.DEPLOYMENTS_DIR || path.join(process.cwd(), 'migration', 'deployments');
  if (!fs.existsSync(dir)) {
    console.error(chalk.red('Deployments directory not found: ' + dir));
    process.exit(1);
  }
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(network + '-') && f.endsWith('.json'));
  if (files.length === 0) {
    console.log(chalk.yellow(`No deployment records for network ${network} in ${dir}`));
    return;
  }
  let failures = 0;
  for (const f of files) {
    const full = path.join(dir, f);
    const data = JSON.parse(fs.readFileSync(full, 'utf8'));
    const name = data.contract || f.replace(`${network}-`, '').replace('.json', '');
    const address = data.address;
    const args = (data.args || data.constructorArgs || []);
    console.log(chalk.cyan(`Verifying ${name} @ ${address} ...`));
    // eslint-disable-next-line no-await-in-loop
    const code = await sdk.verifyContract(network, address, args);
    if (code !== 0) {
      console.log(chalk.red(`- ${name} verification failed with exit code ${code}`));
      failures += 1;
    } else {
      console.log(chalk.green(`- ${name} verified`));
    }
  }
  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


