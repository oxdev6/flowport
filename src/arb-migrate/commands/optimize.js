// import { ethers } from 'ethers';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeOptimizations } from '../../lib/optimizer/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function optimizeContract(contractPath, options = {}) {
  console.log(chalk.blue.bold('\n🔧 Arbitrum Contract Optimizer\n'));
  
  try {
    if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract file not found: ${contractPath}`);
    }
    
    const contractCode = fs.readFileSync(contractPath, 'utf8');
    console.log(chalk.gray(`Analyzing contract: ${path.basename(contractPath)}`));
    
    // Perform optimization analysis
    const optimizations = await analyzeOptimizations(contractCode, options);
    
    // Display results
    displayOptimizations(optimizations);
    
    // Generate optimized code if requested
    if (options.output) {
      await generateOptimizedCode(contractCode, optimizations, options.output);
    }
    
    return optimizations;
    
  } catch (error) {
    console.error(chalk.red.bold('❌ Optimization failed:'), error.message);
    process.exit(1);
  }
}

// analyzeOptimizations implementation has been moved to src/lib/optimizer/index.js

function _generateStoragePackingExample(variables) {
  return `// Before:
${variables.map(v => `uint256 ${v};`).join('\n')}

// After:
struct PackedData {
    uint128 ${variables[0]};
    uint128 ${variables[1] || 'unused'};
}
PackedData public packedData;`;
}

function _generateCalldataExample() {
  return `// Before:
function processData(string memory data) external {
    // function body
}

// After:
function processData(string calldata data) external {
    // function body
}`;
}

function _generateGasOptimizationExample(operation) {
  switch (operation) {
    case 'transfer() calls':
      return `// Before:
recipient.transfer(amount);

// After:
(bool success, ) = recipient.call{value: amount}("");
require(success, "Transfer failed");`;
    case 'loops':
      return `// Before:
for (uint i = 0; i < array.length; i++) {
    // expensive operation
}

// After:
uint length = array.length;
for (uint i = 0; i < length; i++) {
    // expensive operation
}`;
    default:
      return 'Consider reviewing the specific implementation for optimization opportunities.';
  }
}

function _generateArbitrumExample(operation) {
  switch (operation) {
    case 'block.timestamp usage':
      return `// Before:
uint256 timestamp = block.timestamp;

// After:
uint256 timestamp = block.timestamp; // Arbitrum L2 timestamp
// Consider using Arbitrum's specific timestamp if needed`;
    case 'msg.gas usage':
      return `// Before:
uint256 gasLeft = msg.gas;

// After:
// msg.gas behavior differs on Arbitrum
// Consider alternative gas estimation methods`;
    default:
      return 'Review Arbitrum-specific documentation for best practices.';
  }
}

function displayOptimizations(optimizations) {
  console.log(chalk.green.bold('\n✅ Optimization Analysis Complete!\n'));
  
  if (optimizations.length === 0) {
    console.log(chalk.yellow('No optimization opportunities found. Contract is already well-optimized!'));
    return;
  }
  
  // Group by priority
  const highPriority = optimizations.filter(opt => opt.priority === 'high');
  const mediumPriority = optimizations.filter(opt => opt.priority === 'medium');
  const lowPriority = optimizations.filter(opt => opt.priority === 'low');
  
  // Display high priority optimizations
  if (highPriority.length > 0) {
    console.log(chalk.red.bold('🔴 High Priority Optimizations:'));
    highPriority.forEach(displayOptimization);
    console.log();
  }
  
  // Display medium priority optimizations
  if (mediumPriority.length > 0) {
    console.log(chalk.yellow.bold('🟡 Medium Priority Optimizations:'));
    mediumPriority.forEach(displayOptimization);
    console.log();
  }
  
  // Display low priority optimizations
  if (lowPriority.length > 0) {
    console.log(chalk.green.bold('🟢 Low Priority Optimizations:'));
    lowPriority.forEach(displayOptimization);
    console.log();
  }
  
  // Summary
  const totalGasSavings = optimizations.reduce((sum, opt) => {
    const gas = parseInt(opt.gas_savings.match(/\d+/)?.[0] || '0');
    return sum + gas;
  }, 0);
  
  console.log(chalk.blue.bold('📊 Summary:'));
  console.log(`Total optimizations found: ${optimizations.length}`);
  console.log(`Estimated gas savings: ${totalGasSavings.toLocaleString()} gas`);
  console.log(`High priority items: ${highPriority.length}`);
  console.log(`Medium priority items: ${mediumPriority.length}`);
  console.log(`Low priority items: ${lowPriority.length}`);
}

function displayOptimization(optimization) {
  console.log(chalk.bold(`  ${optimization.title}`));
  console.log(chalk.gray(`    ${optimization.description}`));
  console.log(chalk.green(`    Gas Savings: ${optimization.gas_savings}`));
  console.log(chalk.blue(`    Recommendation: ${optimization.recommendation}`));
  console.log(chalk.yellow(`    Impact: ${optimization.impact}`));
  console.log();
}

async function generateOptimizedCode(originalCode, optimizations, outputPath) {
  let optimizedCode = originalCode;
  
  // Apply optimizations
  optimizations.forEach(optimization => {
    if (optimization.implementation && optimization.implementation !== 'Security feature - no changes needed') {
      // Add optimization comments
      optimizedCode += `\n\n// OPTIMIZATION: ${optimization.title}\n`;
      optimizedCode += `// ${optimization.description}\n`;
      optimizedCode += `// Gas Savings: ${optimization.gas_savings}\n`;
      optimizedCode += `// Implementation:\n`;
      optimizedCode += `/*\n${optimization.implementation}\n*/\n`;
    }
  });
  
  // Write optimized code
  fs.writeFileSync(outputPath, optimizedCode);
  console.log(chalk.green(`✓ Optimized code written to: ${outputPath}`));
}
