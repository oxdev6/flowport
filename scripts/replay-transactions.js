const hre = require('hardhat');
const chalk = require('chalk');

async function main() {
  const fromAddress = process.env.REPLAY_FROM_ADDRESS || '0x06395a32ba4c6a468D35E451cbf93b0f07da902b';
  const blocksToReplay = parseInt(process.env.REPLAY_BLOCKS || '10');
  const startBlock = process.env.REPLAY_START_BLOCK;
  const dryRun = process.env.REPLAY_DRY_RUN === '1';
  const jsonOutput = process.env.REPLAY_JSON_OUT === '1';

  // Validate environment
  if (!process.env.SEPOLIA_RPC_URL) {
    console.error(chalk.red('Missing SEPOLIA_RPC_URL environment variable'));
    process.exit(1);
  }

  if (!process.env.ARB_RPC_URL) {
    console.error(chalk.red('Missing ARB_RPC_URL environment variable'));
    process.exit(1);
  }

  if (!dryRun && !process.env.PRIVATE_KEY) {
    console.error(chalk.red('Missing PRIVATE_KEY for non-dry-run mode'));
    process.exit(1);
  }

  console.log(chalk.cyan('🔍 Transaction Replay: Sepolia → Arbitrum Sepolia'));
  console.log(chalk.gray(`From: ${fromAddress}`));
  console.log(chalk.gray(`Blocks: ${blocksToReplay}`));
  console.log(chalk.gray(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`));

  // Setup providers
  const sepoliaProvider = new hre.ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const arbProvider = new hre.ethers.JsonRpcProvider(process.env.ARB_RPC_URL);
  
  let signer;
  if (!dryRun) {
    signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY, arbProvider);
    console.log(chalk.gray(`Replayer: ${await signer.getAddress()}`));
  }

  // Get block range
  const latestSepolia = await sepoliaProvider.getBlockNumber();
  const endBlock = startBlock ? parseInt(startBlock) : latestSepolia;
  const startBlockNum = endBlock - blocksToReplay + 1;

  console.log(chalk.gray(`Block range: ${startBlockNum} → ${endBlock}`));

  // Fetch transactions
  const transactions = [];
  console.log(chalk.yellow('\n📥 Fetching transactions from Sepolia...'));

  for (let blockNum = startBlockNum; blockNum <= endBlock; blockNum++) {
    try {
      const block = await sepoliaProvider.getBlock(blockNum, true);
      if (!block) continue;

      const relevantTxs = block.transactions.filter(tx => 
        tx.from?.toLowerCase() === fromAddress.toLowerCase()
      );

      for (const tx of relevantTxs) {
        transactions.push({
          blockNumber: blockNum,
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          data: tx.data,
          gasLimit: tx.gasLimit,
          gasPrice: tx.gasPrice,
          nonce: tx.nonce
        });
      }

      if (blockNum % 5 === 0) {
        console.log(chalk.gray(`  Processed block ${blockNum}/${endBlock}`));
      }
    } catch (error) {
      console.warn(chalk.yellow(`  Warning: Could not fetch block ${blockNum}: ${error.message}`));
    }
  }

  console.log(chalk.green(`✅ Found ${transactions.length} transactions to replay`));

  if (transactions.length === 0) {
    console.log(chalk.yellow('No transactions found for the specified address and block range'));
    if (jsonOutput) {
      console.log(JSON.stringify({
        success: true,
        message: 'No transactions found',
        stats: {
          blocksProcessed: endBlock - startBlockNum + 1,
          transactionsFound: 0,
          replayed: 0,
          failed: 0
        },
        transactions: []
      }));
    }
    return;
  }

  // Replay transactions
  console.log(chalk.yellow('\n🔄 Replaying transactions on Arbitrum Sepolia...'));
  
  const results = {
    success: true,
    stats: {
      blocksProcessed: endBlock - startBlockNum + 1,
      transactionsFound: transactions.length,
      replayed: 0,
      failed: 0,
      skipped: 0
    },
    transactions: []
  };

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    console.log(chalk.cyan(`\n[${i + 1}/${transactions.length}] Replaying ${tx.hash.substring(0, 10)}...`));
    
    try {
      if (dryRun) {
        // Simulate transaction
        const gasEstimate = await arbProvider.estimateGas({
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
      } else {
        // Send actual transaction
        const txResponse = await signer.sendTransaction({
          to: tx.to,
          value: tx.value,
          data: tx.data,
          gasLimit: tx.gasLimit
        });

        const receipt = await txResponse.wait();
        
        const result = {
          originalHash: tx.hash,
          originalBlock: tx.blockNumber,
          newHash: txResponse.hash,
          newBlock: receipt.blockNumber,
          status: receipt.status === 1 ? 'success' : 'failed',
          gasUsed: receipt.gasUsed.toString(),
          error: receipt.status === 0 ? 'Transaction reverted' : null
        };

        results.transactions.push(result);
        
        if (receipt.status === 1) {
          results.stats.replayed++;
          console.log(chalk.green(`  ✅ Replayed → ${txResponse.hash}`));
        } else {
          results.stats.failed++;
          console.log(chalk.red(`  ❌ Failed → ${txResponse.hash}`));
        }
      }
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

    // Small delay between transactions
    if (!dryRun && i < transactions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log(chalk.cyan('\n📊 Replay Summary:'));
  console.log(chalk.gray(`  Blocks processed: ${results.stats.blocksProcessed}`));
  console.log(chalk.gray(`  Transactions found: ${results.stats.transactionsFound}`));
  console.log(chalk.green(`  Successfully replayed: ${results.stats.replayed}`));
  console.log(chalk.red(`  Failed: ${results.stats.failed}`));

  if (jsonOutput) {
    console.log('\n' + JSON.stringify(results, null, 2));
  }

  if (results.stats.failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('Replay failed:'), error);
  process.exit(1);
});
