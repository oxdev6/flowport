import { ethers } from 'ethers';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function analyzeOptimizations(contractCode, options) {
  const optimizations = [];
  
  // Storage packing analysis
  const storageOptimizations = analyzeStoragePacking(contractCode);
  optimizations.push(...storageOptimizations);
  
  // Calldata optimization analysis
  const calldataOptimizations = analyzeCalldataUsage(contractCode);
  optimizations.push(...calldataOptimizations);
  
  // Gas optimization analysis
  const gasOptimizations = analyzeGasOptimizations(contractCode);
  optimizations.push(...gasOptimizations);
  
  // Arbitrum-specific optimizations
  const arbitrumOptimizations = analyzeArbitrumSpecific(contractCode);
  optimizations.push(...arbitrumOptimizations);
  
  // Security optimizations
  const securityOptimizations = analyzeSecurityOptimizations(contractCode);
  optimizations.push(...securityOptimizations);
  
  return optimizations;
}

function analyzeStoragePacking(contractCode) {
  const optimizations = [];
  
  // Find uint256 variables that could be packed
  const uint256Pattern = /uint256\s+(\w+)/g;
  const matches = [...contractCode.matchAll(uint256Pattern)];
  
  if (matches.length > 1) {
    const variables = matches.map(match => match[1]);
    
    optimizations.push({
      type: 'storage_packing',
      priority: 'high',
      title: 'Storage Packing Opportunity',
      description: `Found ${matches.length} uint256 variables that could be packed into fewer storage slots`,
      gas_savings: `${matches.length * 20000} gas per transaction`,
      recommendation: `Consider using uint128 or smaller types for: ${variables.join(', ')}`,
      implementation: generateStoragePackingExample(variables),
      impact: 'High'
    });
  }
  
  return optimizations;
}

function analyzeCalldataUsage(contractCode) {
  const optimizations = [];
  
  // Find functions with memory parameters that could use calldata
  const functionPattern = /function\s+\w+\s*\([^)]*memory[^)]*\)/g;
  const matches = [...contractCode.matchAll(functionPattern)];
  
  if (matches.length > 0) {
    optimizations.push({
      type: 'calldata_optimization',
      priority: 'medium',
      title: 'Calldata Optimization',
      description: `Found ${matches.length} functions using memory parameters that could use calldata`,
      gas_savings: `${matches.length * 3000} gas per function call`,
      recommendation: 'Replace memory parameters with calldata for read-only functions',
      implementation: generateCalldataExample(),
      impact: 'Medium'
    });
  }
  
  return optimizations;
}

function analyzeGasOptimizations(contractCode) {
  const optimizations = [];
  
  // Check for expensive operations
  const expensivePatterns = [
    { pattern: /\.transfer\(/, name: 'transfer() calls', gas: 2300 },
    { pattern: /\.call\(/, name: 'call() operations', gas: 2600 },
    { pattern: /for\s*\([^)]*\)\s*\{/, name: 'loops', gas: 1000 },
    { pattern: /mapping\s*\([^)]*\)\s*mapping/, name: 'nested mappings', gas: 5000 }
  ];
  
  expensivePatterns.forEach(({ pattern, name, gas }) => {
    const matches = contractCode.match(pattern);
    if (matches) {
      optimizations.push({
        type: 'gas_optimization',
        priority: 'medium',
        title: `${name} Detected`,
        description: `Found ${matches.length} instances of ${name.toLowerCase()}`,
        gas_savings: `${matches.length * gas} gas per operation`,
        recommendation: `Consider optimizing ${name.toLowerCase()} for better gas efficiency`,
        implementation: generateGasOptimizationExample(name),
        impact: 'Medium'
      });
    }
  });
  
  return optimizations;
}

function analyzeArbitrumSpecific(contractCode) {
  const optimizations = [];
  
  // Arbitrum-specific optimizations
  const arbitrumPatterns = [
    {
      pattern: /block\.timestamp/,
      name: 'block.timestamp usage',
      recommendation: 'Consider using Arbitrum\'s L2 block timestamp for better accuracy',
      gas_savings: '500 gas per call'
    },
    {
      pattern: /msg\.gas/,
      name: 'msg.gas usage',
      recommendation: 'msg.gas behavior differs on Arbitrum - consider alternatives',
      gas_savings: '1000 gas per call'
    }
  ];
  
  arbitrumPatterns.forEach(({ pattern, name, recommendation, gas_savings }) => {
    const matches = contractCode.match(pattern);
    if (matches) {
      optimizations.push({
        type: 'arbitrum_specific',
        priority: 'high',
        title: name,
        description: `Found ${matches.length} instances of ${name.toLowerCase()}`,
        gas_savings,
        recommendation,
        implementation: generateArbitrumExample(name),
        impact: 'High'
      });
    }
  });
  
  return optimizations;
}

function analyzeSecurityOptimizations(contractCode) {
  const optimizations = [];
  
  // Security checks
  const securityPatterns = [
    {
      pattern: /require\s*\([^)]*\)/,
      name: 'require statements',
      recommendation: 'Good security practice detected'
    },
    {
      pattern: /modifier\s+\w+/,
      name: 'modifiers',
      recommendation: 'Access control modifiers detected'
    },
    {
      pattern: /reentrancyGuard/,
      name: 'reentrancy protection',
      recommendation: 'Reentrancy protection detected'
    }
  ];
  
  securityPatterns.forEach(({ pattern, name, recommendation }) => {
    const matches = contractCode.match(pattern);
    if (matches) {
      optimizations.push({
        type: 'security_check',
        priority: 'low',
        title: `${name} Found`,
        description: `Found ${matches.length} instances of ${name.toLowerCase()}`,
        gas_savings: '0 gas (security feature)',
        recommendation,
        implementation: 'Security feature - no changes needed',
        impact: 'Low'
      });
    }
  });
  
  return optimizations;
}

function generateStoragePackingExample(variables) {
  return `// Before:
${variables.map(v => `uint256 ${v};`).join('\n')}

// After:
struct PackedData {
    uint128 ${variables[0]};
    uint128 ${variables[1] || 'unused'};
}
PackedData public packedData;`;
}

function generateCalldataExample() {
  return `// Before:
function processData(string memory data) external {
    // function body
}

// After:
function processData(string calldata data) external {
    // function body
}`;
}

function generateGasOptimizationExample(operation) {
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

function generateArbitrumExample(operation) {
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
