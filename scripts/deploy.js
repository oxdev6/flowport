const hre = require('hardhat');

async function main() {
  const initialValue = Number(process.env.COUNTER_INITIAL || 0);
  console.log(`Network: ${hre.network.name}`);

  const Counter = await hre.ethers.getContractFactory('Counter');
  const counter = await Counter.deploy(initialValue);
  await counter.waitForDeployment();
  const address = await counter.getAddress();

  console.log('Counter deployed at:', address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


