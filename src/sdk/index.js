const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function getDeployer(hre) {
  const [signer] = await hre.ethers.getSigners();
  return signer.getAddress();
}

async function getBalance(hre, address) {
  return hre.ethers.provider.getBalance(address);
}

async function deployContract(hre, contractName, constructorArgs) {
  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = await factory.deploy(...(constructorArgs || []));
  await contract.waitForDeployment();
  return contract;
}

function saveDeploymentRecord(networkName, contractName, address, txHash, extras = {}) {
  const outDir = path.join(process.cwd(), 'migration', 'deployments');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${networkName}-${contractName}.json`);
  const data = { network: networkName, contract: contractName, address, txHash, ...extras };
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  return outPath;
}

function loadDeploymentRecord(networkName, contractName) {
  const inPath = path.join(process.cwd(), 'migration', 'deployments', `${networkName}-${contractName}.json`);
  if (!fs.existsSync(inPath)) return null;
  return JSON.parse(fs.readFileSync(inPath, 'utf8'));
}

function verifyContract(network, address, constructorArgs = []) {
  return new Promise((resolve) => {
    const args = ['hardhat', 'verify', '--network', network, address, ...constructorArgs.map(String)];
    const proc = spawn('npx', args, { stdio: 'inherit' });
    proc.on('exit', (code) => resolve(code ?? 0));
  });
}

module.exports = {
  getDeployer,
  getBalance,
  deployContract,
  saveDeploymentRecord,
  loadDeploymentRecord,
  verifyContract,
};


