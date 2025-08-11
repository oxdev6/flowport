import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

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

function getDeploymentsDir() {
  return process.env.DEPLOYMENTS_DIR || path.join(process.cwd(), 'migration', 'deployments');
}

async function saveDeploymentRecord(contractName, address, network, gasUsed, txHash) {
  const deploymentsDir = path.join(process.cwd(), 'migration', 'deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const filename = `${network}-${contractName}-${timestamp.split('T')[0]}.json`;
  const filepath = path.join(deploymentsDir, filename);
  
  const deploymentData = {
    contract: contractName,
    address,
    network,
    gasUsed: gasUsed.toString(),
    txHash,
    timestamp
  };
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));
  
  return filepath;
}

function loadDeploymentRecord(networkName, contractName) {
  const inPath = path.join(getDeploymentsDir(), `${networkName}-${contractName}.json`);
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

export {
  getDeployer,
  getBalance,
  deployContract,
  saveDeploymentRecord,
  loadDeploymentRecord,
  verifyContract,
};


