import { analyzeWithAst } from '../src/lib/optimizer/astAnalyzer.js';

describe('AST analyzer', () => {
  it('detects calldata opportunity for memory arrays in view functions', () => {
    const code = `// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    contract C {
      function sum(uint256[] memory xs) external view returns (uint256) {
        uint256 s; for (uint i=0;i<xs.length;i++){ s += xs[i]; } return s;
      }
    }`;
    const res = analyzeWithAst(code);
    expect(res.some(r => r.type === 'calldata_optimization')).toBe(true);
  });

  it('detects multiple uint256 state variables for packing', () => {
    const code = `pragma solidity ^0.8.0; contract C { uint256 a; uint256 b; }`;
    const res = analyzeWithAst(code);
    expect(res.some(r => r.type === 'storage_packing')).toBe(true);
  });
});
