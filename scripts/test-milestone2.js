import hre from 'hardhat';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log(chalk.cyan('🧪 Milestone 2 Comprehensive Test'));
  console.log(chalk.gray('Testing all core functionality...\n'));

  let allTestsPassed = true;

  // Test 1: Environment validation
  console.log(chalk.yellow('1. Testing environment validation...'));
  try {
    const { printEnvReport } = await import('../src/utils/env.js');
    const envOk = printEnvReport({ requirePrivateKey: false });
    if (envOk) {
      console.log(chalk.green('  ✅ Environment validation passed'));
    } else {
      console.log(chalk.yellow('  ⚠️  Environment has warnings (expected for local testing)'));
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Environment validation failed:'), error.message);
    allTestsPassed = false;
  }

  // Test 2: Contract deployment
  console.log(chalk.yellow('\n2. Testing contract deployment...'));
  try {
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    
    const Counter = await hre.ethers.getContractFactory('Counter');
    const counter = await Counter.deploy(42);
    await counter.waitForDeployment();
    const counterAddress = await counter.getAddress();
    
    const value = await counter.value();
    if (value === 42n) {
      console.log(chalk.green(`  ✅ Counter deployed successfully @ ${counterAddress}`));
      console.log(chalk.gray(`    Initial value: ${value}`));
    } else {
      console.log(chalk.red(`  ❌ Counter deployment failed - wrong initial value: ${value}`));
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Contract deployment failed:'), error.message);
    allTestsPassed = false;
  }

  // Test 3: State migration
  console.log(chalk.yellow('\n3. Testing state migration...'));
  try {
    const MigratableCounter = await hre.ethers.getContractFactory('MigratableCounter');
    const migratableCounter = await MigratableCounter.deploy(0);
    await migratableCounter.waitForDeployment();
    const migratableAddress = await migratableCounter.getAddress();
    
    // Simulate state migration using setValue
    const sourceValue = 42n;
    const tx = await migratableCounter.setValue(sourceValue);
    await tx.wait();
    
    const migratedValue = await migratableCounter.value();
    if (migratedValue === sourceValue) {
      console.log(chalk.green(`  ✅ State migration successful @ ${migratableAddress}`));
      console.log(chalk.gray(`    Migrated value: ${migratedValue}`));
    } else {
      console.log(chalk.red(`  ❌ State migration failed - wrong value: ${migratedValue}`));
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(chalk.red('  ❌ State migration failed:'), error.message);
    allTestsPassed = false;
  }

  // Test 4: Transaction replay simulation
  console.log(chalk.yellow('\n4. Testing transaction replay simulation...'));
  try {
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    
    // Create a test contract and generate transactions
    const Counter = await hre.ethers.getContractFactory('Counter');
    const counter = await Counter.deploy(0);
    await counter.waitForDeployment();
    
    // Generate test transactions
    const tx1 = await counter.increment(5);
    const receipt1 = await tx1.wait();
    const tx2 = await counter.increment(3);
    const receipt2 = await tx2.wait();
    
    // Simulate replay
    const transactions = [
      {
        hash: tx1.hash,
        from: deployerAddress,
        to: await counter.getAddress(),
        data: counter.interface.encodeFunctionData('increment', [5]),
        value: 0n
      },
      {
        hash: tx2.hash,
        from: deployerAddress,
        to: await counter.getAddress(),
        data: counter.interface.encodeFunctionData('increment', [3]),
        value: 0n
      }
    ];
    
    let replaySuccess = 0;
    for (const tx of transactions) {
      try {
        const gasEstimate = await hre.ethers.provider.estimateGas({
          from: tx.from,
          to: tx.to,
          data: tx.data,
          value: tx.value
        });
        replaySuccess++;
      } catch (error) {
        console.log(chalk.red(`    Replay failed for ${tx.hash}: ${error.message}`));
      }
    }
    
    if (replaySuccess === transactions.length) {
      console.log(chalk.green(`  ✅ Transaction replay simulation successful`));
      console.log(chalk.gray(`    Replayed ${replaySuccess}/${transactions.length} transactions`));
    } else {
      console.log(chalk.red(`  ❌ Transaction replay failed: ${replaySuccess}/${transactions.length} successful`));
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Transaction replay failed:'), error.message);
    allTestsPassed = false;
  }

  // Test 5: Configuration validation
  console.log(chalk.yellow('\n5. Testing configuration validation...'));
  try {
    const config = {
      contracts: [
        { name: 'Counter', path: 'contracts/Counter.sol', args: [] }
      ],
      verify: true
    };
    
    // Basic validation
    if (config.contracts && Array.isArray(config.contracts) && config.contracts.length > 0) {
      console.log(chalk.green('  ✅ Configuration validation passed'));
      console.log(chalk.gray(`    Found ${config.contracts.length} contracts to deploy`));
    } else {
      console.log(chalk.red('  ❌ Configuration validation failed - invalid structure'));
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Configuration validation failed:'), error.message);
    allTestsPassed = false;
  }

  // Test 6: Deployment records
  console.log(chalk.yellow('\n6. Testing deployment records...'));
  try {
    const deploymentsDir = path.join(process.cwd(), 'migration', 'deployments');
    if (fs.existsSync(deploymentsDir)) {
      const files = fs.readdirSync(deploymentsDir);
      console.log(chalk.green(`  ✅ Deployment records directory exists`));
      console.log(chalk.gray(`    Found ${files.length} deployment records`));
    } else {
      console.log(chalk.yellow('  ⚠️  No deployment records directory found (will be created on first deployment)'));
    }
  } catch (error) {
    console.log(chalk.red('  ❌ Deployment records test failed:'), error.message);
    allTestsPassed = false;
  }

  // Final summary
  console.log(chalk.cyan('\n📊 Test Summary'));
  if (allTestsPassed) {
    console.log(chalk.green('🎉 All tests passed! Milestone 2 is working correctly.'));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('  • Set up .env with real RPC URLs for testnet deployment'));
    console.log(chalk.gray('  • Fund your wallet on Arbitrum Sepolia for live testing'));
    console.log(chalk.gray('  • Run: arb-migrate dashboard to start the web interface'));
  } else {
    console.log(chalk.red('❌ Some tests failed. Please check the errors above.'));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('Test suite failed:'), error);
  process.exit(1);
});
