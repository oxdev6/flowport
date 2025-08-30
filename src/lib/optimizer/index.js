// Note: keep this module dependency-light; avoid unused imports
import { computeSourceHash, readCacheByHash, writeCacheByHash } from './cache.js';
import { runSlitherOnSource } from './slither.js';
import { analyzeWithAst } from './astAnalyzer.js';

// Shared Optimizer Library
// --------------------------------------------------
// This module provides a set of static-analysis helpers that identify
// storage-, calldata-, gas-, Arbitrum-specific and security-related
// optimization opportunities in Solidity source code.
// It is consumed by both the CLI (arb-migrate optimize) and the web
// API route (POST /api/optimize).

export async function analyzeOptimizations(contractCode, _options = {}) {
  // Cache lookup
  const hash = computeSourceHash(contractCode);
  const cached = readCacheByHash(hash);
  if (cached && Array.isArray(cached.suggestions)) {
    return cached.suggestions;
  }

  const optimizations = [];

  // Storage packing analysis (regex heuristics)
  optimizations.push(...analyzeStoragePacking(contractCode).map((s) => ({ ...s, source: 'heuristic' })));
  // Calldata optimization analysis
  optimizations.push(...analyzeCalldataUsage(contractCode).map((s) => ({ ...s, source: 'heuristic' })));
  // Gas optimization analysis
  optimizations.push(...analyzeGasOptimizations(contractCode).map((s) => ({ ...s, source: 'heuristic' })));
  // Arbitrum-specific optimizations
  optimizations.push(...analyzeArbitrumSpecific(contractCode).map((s) => ({ ...s, source: 'heuristic' })));
  // Security optimizations (informational)
  optimizations.push(...analyzeSecurityOptimizations(contractCode).map((s) => ({ ...s, source: 'heuristic' })));

  // AST-based analysis to improve accuracy
  try {
    const astSuggestions = analyzeWithAst(contractCode);
    if (Array.isArray(astSuggestions) && astSuggestions.length) {
      optimizations.push(...astSuggestions.map((s) => ({ ...s, source: s.source || 'ast' })));
    }
  } catch {}

  // Optional: Slither findings merged in
  try {
    const slither = runSlitherOnSource(contractCode);
    if (slither.used && Array.isArray(slither.suggestions)) {
      optimizations.push(...slither.suggestions.map((s) => ({ ...s, source: 'slither' })));
    }
  } catch {}

  // Write cache
  writeCacheByHash(hash, { suggestions: optimizations, createdAt: Date.now() });
  return optimizations;
}

// --------------------------------------------------
// Individual analyzers
// --------------------------------------------------
function analyzeStoragePacking(contractCode) {
  const optimizations = [];
  const uint256Pattern = /uint256\s+(\w+)/g;
  const matches = [...contractCode.matchAll(uint256Pattern)];

  if (matches.length > 1) {
    const variables = matches.map((m) => m[1]);
    optimizations.push({
      type: 'storage_packing',
      priority: 'high',
      title: 'Storage Packing Opportunity',
      description: `Found ${matches.length} uint256 variables that could be packed into fewer storage slots`,
      gas_savings: `${matches.length * 20000} gas per transaction`,
      recommendation: `Consider using uint128 or smaller types for: ${variables.join(', ')}`,
      implementation: generateStoragePackingExample(variables),
      impact: 'High',
    });
  }
  return optimizations;
}

function analyzeCalldataUsage(contractCode) {
  const optimizations = [];
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
      impact: 'Medium',
    });
  }
  return optimizations;
}

function analyzeGasOptimizations(contractCode) {
  const optimizations = [];
  const expensive = [
    { pattern: /\.transfer\(/g, name: 'transfer() calls', gas: 2300 },
    { pattern: /\.call\(/g, name: 'call() operations', gas: 2600 },
    { pattern: /for\s*\([^)]*\)\s*\{/g, name: 'loops', gas: 1000 },
    { pattern: /mapping\s*\([^)]*\)\s*mapping/g, name: 'nested mappings', gas: 5000 },
  ];

  for (const { pattern, name, gas } of expensive) {
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
        impact: 'Medium',
      });
    }
  }
  return optimizations;
}

function analyzeArbitrumSpecific(contractCode) {
  const optimizations = [];
  const patterns = [
    {
      pattern: /block\.timestamp/g,
      name: 'block.timestamp usage',
      recommendation: "Consider using Arbitrum's L2 block timestamp for better accuracy",
      gas_savings: '500 gas per call',
    },
    {
      pattern: /msg\.gas/g,
      name: 'msg.gas usage',
      recommendation: 'msg.gas behavior differs on Arbitrum ‑ consider alternatives',
      gas_savings: '1000 gas per call',
    },
  ];

  for (const { pattern, name, recommendation, gas_savings } of patterns) {
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
        impact: 'High',
      });
    }
  }
  return optimizations;
}

function analyzeSecurityOptimizations(contractCode) {
  const optimizations = [];
  const checks = [
    { pattern: /require\s*\([^)]*\)/g, name: 'require statements', recommendation: 'Good security practice detected' },
    { pattern: /modifier\s+\w+/g, name: 'modifiers', recommendation: 'Access control modifiers detected' },
    { pattern: /reentrancyGuard/gi, name: 'reentrancy protection', recommendation: 'Reentrancy protection detected' },
  ];

  for (const { pattern, name, recommendation } of checks) {
    const matches = contractCode.match(pattern);
    if (matches) {
      optimizations.push({
        type: 'security_check',
        priority: 'low',
        title: `${name} Found`,
        description: `Found ${matches.length} instances of ${name.toLowerCase()}`,
        gas_savings: '0 gas (security feature)',
        recommendation,
        implementation: 'Security feature – no changes needed',
        impact: 'Low',
      });
    }
  }
  return optimizations;
}

// --------------------------------------------------
// Helper example generators
// --------------------------------------------------
function generateStoragePackingExample(vars) {
  return `// Before:\n${vars.map((v) => `uint256 ${v};`).join('\n')}\n\n// After:\nstruct PackedData {\n    uint128 ${vars[0]};\n    uint128 ${vars[1] || 'unused'};\n}\nPackedData public packedData;`;
}

function generateCalldataExample() {
  return `// Before:\nfunction processData(string memory data) external {\n    // ...\n}\n\n// After:\nfunction processData(string calldata data) external {\n    // ...\n}`;
}

function generateGasOptimizationExample(op) {
  switch (op) {
    case 'transfer() calls':
      return `// Before:\nrecipient.transfer(amount);\n\n// After:\n(bool success, ) = recipient.call{value: amount}("");\nrequire(success, "Transfer failed");`;
    case 'loops':
      return `// Before:\nfor (uint i = 0; i < array.length; i++) {\n    // expensive\n}\n\n// After:\nuint length = array.length;\nfor (uint i = 0; i < length; i++) {\n    // expensive\n}`;
    default:
      return 'Review implementation for optimization opportunities.';
  }
}

function generateArbitrumExample(op) {
  switch (op) {
    case 'block.timestamp usage':
      return `// Before:\nuint256 timestamp = block.timestamp;\n\n// After:\nuint256 timestamp = block.timestamp; // Arbitrum L2 timestamp`;
    case 'msg.gas usage':
      return `// Before:\nuint256 gasLeft = msg.gas;\n\n// After:\n// msg.gas behavior differs on Arbitrum – consider alternative estimation methods`;
    default:
      return 'Review Arbitrum documentation for best practices.';
  }
}
