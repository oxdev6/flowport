import { ethers } from 'ethers';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function benchmarkContract(contractPath, options = {}) {
  console.log(chalk.blue.bold('\n⚡ Arbitrum Performance Benchmark\n'));
  
  try {
    if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract file not found: ${contractPath}`);
    }
    
    const contractCode = fs.readFileSync(contractPath, 'utf8');
    console.log(chalk.gray(`Benchmarking contract: ${path.basename(contractPath)}`));
    
    // Perform comprehensive benchmarking
    const benchmarks = await performBenchmarks(contractCode, options);
    
    // Display results
    displayBenchmarks(benchmarks);
    
    // Generate benchmark report if requested
    if (options.output) {
      await generateBenchmarkReport(benchmarks, options.output);
    }
    
    return benchmarks;
    
  } catch (error) {
    console.error(chalk.red.bold('❌ Benchmark failed:'), error.message);
    process.exit(1);
  }
}

async function performBenchmarks(contractCode, options) {
  const benchmarks = {
    contract: {
      name: path.basename(options.contractPath || 'Unknown'),
      size: contractCode.length,
      lines: contractCode.split('\n').length,
      functions: countFunctions(contractCode),
      variables: countVariables(contractCode)
    },
    performance: {
      ethereum: await benchmarkEthereum(contractCode),
      arbitrum: await benchmarkArbitrum(contractCode),
      comparison: {}
    },
    gas_analysis: await analyzeGasUsage(contractCode),
    optimization_potential: await analyzeOptimizationPotential(contractCode),
    security_metrics: await analyzeSecurityMetrics(contractCode)
  };
  
  // Calculate comparison metrics
  benchmarks.performance.comparison = calculateComparison(benchmarks.performance.ethereum, benchmarks.performance.arbitrum);
  
  return benchmarks;
}

function countFunctions(contractCode) {
  const functionMatches = contractCode.match(/function\s+\w+/g);
  return functionMatches ? functionMatches.length : 0;
}

function countVariables(contractCode) {
  const variableMatches = contractCode.match(/(uint|int|bool|address|string|bytes|mapping)\s+\w+/g);
  return variableMatches ? variableMatches.length : 0;
}

async function benchmarkEthereum(contractCode) {
  // Simulate Ethereum performance metrics
  const baseGas = 21000;
  const storageGas = countStorageVariables(contractCode) * 20000;
  const computationGas = countComputations(contractCode) * 5000;
  const totalGas = baseGas + storageGas + computationGas;
  
  return {
    deployment_gas: totalGas * 1.5,
    transaction_gas: totalGas,
    storage_cost: storageGas * 0.000000001 * 2000, // ETH gas price
    computation_cost: computationGas * 0.000000001 * 2000,
    total_cost_per_tx: totalGas * 0.000000001 * 2000,
    throughput: 15, // TPS
    finality: 12, // blocks
    network_congestion: 'High'
  };
}

async function benchmarkArbitrum(contractCode) {
  // Simulate Arbitrum performance metrics
  const baseGas = 21000;
  const storageGas = countStorageVariables(contractCode) * 20000;
  const computationGas = countComputations(contractCode) * 5000;
  const totalGas = baseGas + storageGas + computationGas;
  
  return {
    deployment_gas: totalGas * 1.2,
    transaction_gas: totalGas,
    storage_cost: storageGas * 0.000000001 * 0.1, // Arbitrum gas price
    computation_cost: computationGas * 0.000000001 * 0.1,
    total_cost_per_tx: totalGas * 0.000000001 * 0.1,
    throughput: 4000, // TPS
    finality: 1, // block
    network_congestion: 'Low'
  };
}

function countStorageVariables(contractCode) {
  const storageMatches = contractCode.match(/(uint|int|bool|address|string|bytes|mapping)\s+\w+/g);
  return storageMatches ? storageMatches.length : 0;
}

function countComputations(contractCode) {
  const computationMatches = contractCode.match(/(\+|\-|\*|\/|%|\*\*|==|!=|>|<|>=|<=|&&|\|\||!)/g);
  return computationMatches ? computationMatches.length : 0;
}

function calculateComparison(ethereum, arbitrum) {
  const costSavings = ((ethereum.total_cost_per_tx - arbitrum.total_cost_per_tx) / ethereum.total_cost_per_tx * 100).toFixed(2);
  const throughputImprovement = ((arbitrum.throughput - ethereum.throughput) / ethereum.throughput * 100).toFixed(2);
  const finalityImprovement = ((ethereum.finality - arbitrum.finality) / ethereum.finality * 100).toFixed(2);
  
  return {
    cost_savings_percentage: costSavings,
    throughput_improvement: throughputImprovement,
    finality_improvement: finalityImprovement,
    annual_savings: (ethereum.total_cost_per_tx - arbitrum.total_cost_per_tx) * 365 * 1000, // Assuming 1000 transactions per day
    roi_estimate: calculateROI(ethereum.total_cost_per_tx, arbitrum.total_cost_per_tx)
  };
}

function calculateROI(ethereumCost, arbitrumCost) {
  const savings = ethereumCost - arbitrumCost;
  const migrationCost = 0.1; // Estimated migration cost in ETH
  return ((savings * 365 * 1000 - migrationCost) / migrationCost * 100).toFixed(2);
}

async function analyzeGasUsage(contractCode) {
  const gasUsage = {
    storage_operations: countStorageOperations(contractCode),
    computation_operations: countComputationOperations(contractCode),
    external_calls: countExternalCalls(contractCode),
    memory_operations: countMemoryOperations(contractCode),
    expensive_patterns: findExpensivePatterns(contractCode)
  };
  
  return gasUsage;
}

function countStorageOperations(contractCode) {
  const patterns = [
    { pattern: /\.transfer\(/, gas: 2300, name: 'transfer()' },
    { pattern: /\.call\(/, gas: 2600, name: 'call()' },
    { pattern: /\.delegatecall\(/, gas: 2600, name: 'delegatecall()' },
    { pattern: /\.staticcall\(/, gas: 2600, name: 'staticcall()' },
    { pattern: /for\s*\([^)]*\)\s*\{/, gas: 1000, name: 'loops' },
    { pattern: /while\s*\([^)]*\)\s*\{/, gas: 1000, name: 'while loops' }
  ];
  
  const operations = [];
  patterns.forEach(({ pattern, gas, name }) => {
    const matches = contractCode.match(pattern);
    if (matches) {
      operations.push({
        type: name,
        count: matches.length,
        gas_per_operation: gas,
        total_gas: matches.length * gas
      });
    }
  });
  
  return operations;
}

function countComputationOperations(contractCode) {
  const operations = [
    { pattern: /\+/, name: 'addition' },
    { pattern: /\-/, name: 'subtraction' },
    { pattern: /\*/, name: 'multiplication' },
    { pattern: /\//, name: 'division' },
    { pattern: /%/, name: 'modulo' },
    { pattern: /\*\*/, name: 'exponentiation' }
  ];
  
  const counts = {};
  operations.forEach(({ pattern, name }) => {
    const matches = contractCode.match(pattern);
    counts[name] = matches ? matches.length : 0;
  });
  
  return counts;
}

function countExternalCalls(contractCode) {
  const externalCallPatterns = [
    /\.transfer\(/,
    /\.call\(/,
    /\.delegatecall\(/,
    /\.staticcall\(/,
    /external\s+function/
  ];
  
  let totalCalls = 0;
  externalCallPatterns.forEach(pattern => {
    const matches = contractCode.match(pattern);
    if (matches) {
      totalCalls += matches.length;
    }
  });
  
  return totalCalls;
}

function countMemoryOperations(contractCode) {
  const memoryPatterns = [
    /memory\s+\w+/,
    /new\s+\w+\[\]/,
    /\.push\(/,
    /\.pop\(/
  ];
  
  let totalOperations = 0;
  memoryPatterns.forEach(pattern => {
    const matches = contractCode.match(pattern);
    if (matches) {
      totalOperations += matches.length;
    }
  });
  
  return totalOperations;
}

function findExpensivePatterns(contractCode) {
  const expensivePatterns = [
    {
      pattern: /mapping\s*\([^)]*\)\s*mapping/,
      name: 'Nested Mappings',
      impact: 'High',
      recommendation: 'Consider flattening nested mappings for better gas efficiency'
    },
    {
      pattern: /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)\s*\{/,
      name: 'Nested Loops',
      impact: 'High',
      recommendation: 'Avoid nested loops, consider batch processing'
    },
    {
      pattern: /\.transfer\([^)]*\)/,
      name: 'Transfer Calls',
      impact: 'Medium',
      recommendation: 'Consider using call() instead of transfer() for better gas efficiency'
    }
  ];
  
  const found = [];
  expensivePatterns.forEach(({ pattern, name, impact, recommendation }) => {
    const matches = contractCode.match(pattern);
    if (matches) {
      found.push({
        pattern: name,
        count: matches.length,
        impact,
        recommendation
      });
    }
  });
  
  return found;
}

async function analyzeOptimizationPotential(contractCode) {
  const optimizations = [];
  
  // Storage packing opportunities
  const uint256Vars = (contractCode.match(/uint256\s+(\w+)/g) || []).length;
  if (uint256Vars > 1) {
    optimizations.push({
      type: 'storage_packing',
      potential_savings: uint256Vars * 20000,
      description: `${uint256Vars} uint256 variables could be packed`,
      priority: 'High'
    });
  }
  
  // Calldata optimization
  const memoryParams = (contractCode.match(/memory\s+\w+/g) || []).length;
  if (memoryParams > 0) {
    optimizations.push({
      type: 'calldata_optimization',
      potential_savings: memoryParams * 3000,
      description: `${memoryParams} memory parameters could use calldata`,
      priority: 'Medium'
    });
  }
  
  // Loop optimization
  const loops = (contractCode.match(/for\s*\([^)]*\)/g) || []).length;
  if (loops > 0) {
    optimizations.push({
      type: 'loop_optimization',
      potential_savings: loops * 1000,
      description: `${loops} loops could be optimized`,
      priority: 'Medium'
    });
  }
  
  return optimizations;
}

async function analyzeSecurityMetrics(contractCode) {
  const securityMetrics = {
    reentrancy_protection: hasReentrancyProtection(contractCode),
    access_control: hasAccessControl(contractCode),
    safe_math: hasSafeMath(contractCode),
    input_validation: hasInputValidation(contractCode),
    error_handling: hasErrorHandling(contractCode),
    security_score: 0
  };
  
  // Calculate security score
  let score = 0;
  if (securityMetrics.reentrancy_protection) score += 25;
  if (securityMetrics.access_control) score += 25;
  if (securityMetrics.safe_math) score += 20;
  if (securityMetrics.input_validation) score += 15;
  if (securityMetrics.error_handling) score += 15;
  
  securityMetrics.security_score = score;
  
  return securityMetrics;
}

function hasReentrancyProtection(contractCode) {
  return /reentrancyGuard|nonReentrant|ReentrancyGuard/.test(contractCode);
}

function hasAccessControl(contractCode) {
  return /onlyOwner|modifier|require\s*\([^)]*msg\.sender/.test(contractCode);
}

function hasSafeMath(contractCode) {
  return /SafeMath|@openzeppelin\/contracts\/utils\/math\/SafeMath/.test(contractCode);
}

function hasInputValidation(contractCode) {
  return /require\s*\([^)]*\)|assert\s*\([^)]*\)/.test(contractCode);
}

function hasErrorHandling(contractCode) {
  return /try\s*\{|catch\s*\(|revert\s*\(/.test(contractCode);
}

function displayBenchmarks(benchmarks) {
  console.log(chalk.green.bold('\n✅ Benchmark Analysis Complete!\n'));
  
  // Contract Overview
  console.log(chalk.blue.bold('📋 Contract Overview'));
  console.log('─'.repeat(50));
  console.log(`Name: ${benchmarks.contract.name}`);
  console.log(`Size: ${benchmarks.contract.size} characters`);
  console.log(`Lines: ${benchmarks.contract.lines}`);
  console.log(`Functions: ${benchmarks.contract.functions}`);
  console.log(`Variables: ${benchmarks.contract.variables}\n`);
  
  // Performance Comparison
  console.log(chalk.blue.bold('⚡ Performance Comparison'));
  console.log('─'.repeat(50));
  console.log(`Cost Savings: ${benchmarks.performance.comparison.cost_savings_percentage}%`);
  console.log(`Throughput Improvement: ${benchmarks.performance.comparison.throughput_improvement}%`);
  console.log(`Finality Improvement: ${benchmarks.performance.comparison.finality_improvement}%`);
  console.log(`Annual Savings: $${benchmarks.performance.comparison.annual_savings.toFixed(2)}`);
  console.log(`ROI Estimate: ${benchmarks.performance.comparison.roi_estimate}%\n`);
  
  // Gas Analysis
  console.log(chalk.blue.bold('⛽ Gas Usage Analysis'));
  console.log('─'.repeat(50));
  benchmarks.gas_analysis.storage_operations.forEach(op => {
    console.log(`${op.type}: ${op.count} operations (${op.total_gas} gas)`);
  });
  console.log(`External Calls: ${benchmarks.gas_analysis.external_calls}`);
  console.log(`Memory Operations: ${benchmarks.gas_analysis.memory_operations}\n`);
  
  // Optimization Potential
  if (benchmarks.optimization_potential.length > 0) {
    console.log(chalk.blue.bold('🔧 Optimization Potential'));
    console.log('─'.repeat(50));
    benchmarks.optimization_potential.forEach(opt => {
      console.log(`${opt.type.toUpperCase()} (${opt.priority} priority)`);
      console.log(`  Potential Savings: ${opt.potential_savings.toLocaleString()} gas`);
      console.log(`  Description: ${opt.description}\n`);
    });
  }
  
  // Security Metrics
  console.log(chalk.blue.bold('🔒 Security Assessment'));
  console.log('─'.repeat(50));
  console.log(`Security Score: ${benchmarks.security_metrics.security_score}/100`);
  console.log(`Reentrancy Protection: ${benchmarks.security_metrics.reentrancy_protection ? '✓' : '✗'}`);
  console.log(`Access Control: ${benchmarks.security_metrics.access_control ? '✓' : '✗'}`);
  console.log(`Safe Math: ${benchmarks.security_metrics.safe_math ? '✓' : '✗'}`);
  console.log(`Input Validation: ${benchmarks.security_metrics.input_validation ? '✓' : '✗'}`);
  console.log(`Error Handling: ${benchmarks.security_metrics.error_handling ? '✓' : '✗'}\n`);
  
  // Summary
  console.log(chalk.green.bold('📊 Summary'));
  console.log('─'.repeat(50));
  console.log(`Migration Recommendation: ${getMigrationRecommendation(benchmarks)}`);
  console.log(`Priority Level: ${getPriorityLevel(benchmarks)}`);
  console.log(`Estimated Migration Time: ${getMigrationTime(benchmarks)}`);
}

function getMigrationRecommendation(benchmarks) {
  const savings = parseFloat(benchmarks.performance.comparison.cost_savings_percentage);
  const security = benchmarks.security_metrics.security_score;
  
  if (savings > 90 && security > 80) return 'Strongly Recommended';
  if (savings > 80 && security > 60) return 'Recommended';
  if (savings > 70) return 'Consider Migration';
  return 'Review Required';
}

function getPriorityLevel(benchmarks) {
  const savings = parseFloat(benchmarks.performance.comparison.cost_savings_percentage);
  if (savings > 90) return 'High';
  if (savings > 80) return 'Medium';
  return 'Low';
}

function getMigrationTime(benchmarks) {
  const complexity = benchmarks.contract.functions + benchmarks.contract.variables;
  if (complexity < 10) return '2-4 hours';
  if (complexity < 20) return '1-2 days';
  return '1-2 weeks';
}

async function generateBenchmarkReport(benchmarks, outputPath) {
  const report = {
    timestamp: new Date().toISOString(),
    contract: benchmarks.contract,
    performance: benchmarks.performance,
    gas_analysis: benchmarks.gas_analysis,
    optimization_potential: benchmarks.optimization_potential,
    security_metrics: benchmarks.security_metrics,
    recommendations: {
      migration_recommendation: getMigrationRecommendation(benchmarks),
      priority_level: getPriorityLevel(benchmarks),
      estimated_migration_time: getMigrationTime(benchmarks)
    }
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(chalk.green(`✓ Benchmark report written to: ${outputPath}`));
}
