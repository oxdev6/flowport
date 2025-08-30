import { analyzeOptimizations } from '../src/lib/optimizer/index.js';

describe('analyzeOptimizations', () => {
  it('detects storage packing opportunities', async () => {
    const code = `// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    contract C { uint256 a; uint256 b; }`;

    const results = await analyzeOptimizations(code);
    expect(results.some((r) => r.type === 'storage_packing')).toBe(true);
  });

  it('detects calldata optimization', async () => {
    const code = `pragma solidity ^0.8.0;
    contract C { function foo(string memory data) external {} }`;
    const results = await analyzeOptimizations(code);
    expect(results.some((r) => r.type === 'calldata_optimization')).toBe(true);
  });

  it('categorises priorities correctly', async () => {
    const code = `pragma solidity ^0.8.0;
    contract C { uint256 a; uint256 b; function foo(string memory d) external {} }`;
    const results = await analyzeOptimizations(code);
    const high = results.filter((r) => r.priority === 'high');
    const medium = results.filter((r) => r.priority === 'medium');
    expect(high.length).toBeGreaterThan(0);
    expect(medium.length).toBeGreaterThan(0);
  });
});
