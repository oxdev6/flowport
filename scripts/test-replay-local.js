import hre from 'hardhat';
import chalk from 'chalk';

async function main() {
  console.log(chalk.cyan('🧪 Testing Transaction Replay (Local Simulation)'));
  
  // Setup local network
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log(chalk.gray(`Deployer: ${deployerAddress}`));

  // Deploy Counter contract
  console.log(chalk.yellow('\n📦 Deploying Counter contract...'));
  const Counter = await hre.ethers.getContractFactory('Counter');
  const counter = await Counter.deploy(0);
  await counter.waitForDeployment();
  const counterAddress = await counter.getAddress();
  console.log(chalk.green(`Counter deployed @ ${counterAddress}`));

  // Generate some test transactions
  console.log(chalk.yellow('\n🔄 Generating test transactions...'));
  const transactions = [];
  
  // Transaction 1: Increment counter
  const tx1 = await counter.increment(5);
  const receipt1 = await tx1.wait();
  transactions.push({
    blockNumber: receipt1.blockNumber,
    hash: tx1.hash,
    from: deployerAddress,
    to: counterAddress,
    value: 0n,
    data: counter.interface.encodeFunctionData('increment', [5]),
    gasLimit: receipt1.gasUsed,
    gasPrice: receipt1.gasPrice,
    nonce: receipt1.nonce
  });

  // Transaction 2: Another increment
  const tx2 = await counter.increment(3);
  const receipt2 = await tx2.wait();
  transactions.push({
    blockNumber: receipt2.blockNumber,
    hash: tx2.hash,
    from: deployerAddress,
    to: counterAddress,
    value: 0n,
    data: counter.interface.encodeFunctionData('increment', [3]),
    gasLimit: receipt2.gasUsed,
    gasPrice: receipt2.gasPrice,
    nonce: receipt2.nonce
  });

  console.log(chalk.green(`✅ Generated ${transactions.length} test transactions`));

  // Simulate replay
  console.log(chalk.yellow('\n🔄 Simulating transaction replay...'));
  
  const results = {
    success: true,
    stats: {
      blocksProcessed: 2,
      transactionsFound: transactions.length,
      replayed: 0,
      failed: 0,
      skipped: 0
    },
    transactions: []
  };

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    console.log(chalk.cyan(`\n[${i + 1}/${transactions.length}] Simulating replay of ${tx.hash.substring(0, 10)}...`));
    
    try {
      // Simulate the transaction
      const gasEstimate = await hre.ethers.provider.estimateGas({
        from: tx.from,
        to: tx.to,
        value: tx.value,
        data: tx.data
      });

      const result = {
        originalHash: tx.hash,
        originalBlock: tx.blockNumber,
        status: 'simulated',
        gasEstimate: gasEstimate.toString(),
        error: null
      };

      results.transactions.push(result);
      results.stats.replayed++;
      
      console.log(chalk.green(`  ✅ Simulated (gas: ${gasEstimate.toString()})`));
    } catch (error) {
      const result = {
        originalHash: tx.hash,
        originalBlock: tx.blockNumber,
        status: 'error',
        error: error.message
      };

      results.transactions.push(result);
      results.stats.failed++;
      
      console.log(chalk.red(`  ❌ Error: ${error.message}`));
    }
  }

  // Summary
  console.log(chalk.cyan('\n📊 Replay Simulation Summary:'));
  console.log(chalk.gray(`  Blocks processed: ${results.stats.blocksProcessed}`));
  console.log(chalk.gray(`  Transactions found: ${results.stats.transactionsFound}`));
  console.log(chalk.green(`  Successfully simulated: ${results.stats.replayed}`));
  console.log(chalk.red(`  Failed: ${results.stats.failed}`));

  // Show final counter value
  const finalValue = await counter.value();
  console.log(chalk.cyan(`\n📈 Final Counter Value: ${finalValue.toString()}`));

  // JSON output for testing
  if (process.env.JSON_OUT === '1') {
    console.log('\n' + JSON.stringify(results, null, 2));
    return; // Exit early when JSON output is requested
  }

  console.log(chalk.green('\n✅ Transaction replay simulation completed successfully!'));
}

main().catch((error) => {
  console.error(chalk.red('Replay test failed:'), error);
  process.exit(1);
});
