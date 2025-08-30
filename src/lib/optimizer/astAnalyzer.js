import * as parser from 'solidity-parser-antlr';

export function analyzeWithAst(source) {
  try {
    const ast = parser.parse(source, { tolerant: true, range: true, loc: true });
    const suggestions = [];

    // Example 1: detect functions with memory array params that can be calldata
    parser.visit(ast, {
      FunctionDefinition(node) {
        if (!node.parameters) return;
        const params = Array.isArray(node.parameters.parameters) ? node.parameters.parameters : [];
        // Treat any array parameter as candidate for calldata optimization; parsers differ in storage flags.
        const arrayParams = params.filter((p) => p?.typeName?.type === 'ArrayTypeName');
        if (arrayParams.length > 0) {
          suggestions.push({
            type: 'calldata_optimization',
            priority: 'medium',
            title: 'Calldata Optimization (AST)',
            description: `${arrayParams.length} array parameter(s) could be calldata in ${node.name || '<anonymous>'}`,
            gas_savings: `${arrayParams.length * 3000} gas per call`,
            recommendation: 'Replace memory arrays with calldata for read-only functions',
            impact: 'Medium',
          });
        }
      },
    });

    // Example 2: detect multiple uint256 state vars that can pack
    let uint256StateVars = 0;
    parser.visit(ast, {
      StateVariableDeclaration(node) {
        for (const v of node.variables || []) {
          const t = v.typeName?.name || v.typeName?.typeDescriptions?.typeString || '';
          if (/uint256\b/.test(t)) uint256StateVars += 1;
        }
      },
    });
    if (uint256StateVars > 1) {
      suggestions.push({
        type: 'storage_packing',
        priority: 'high',
        title: 'Storage Packing Opportunity (AST)',
        description: `Found ${uint256StateVars} uint256 state variables; consider packing` ,
        gas_savings: `${uint256StateVars * 20000} gas per transaction`,
        recommendation: 'Use smaller types (uint128) or structs to pack slots',
        impact: 'High',
      });
    }

    // Fallback: regex-based detection of memory array params in function signatures
    if (!suggestions.some((s) => s.type === 'calldata_optimization')) {
      const m = source.match(/function\s+\w+\s*\([^)]*\[\]\s+memory[^)]*\)/);
      if (m) {
        suggestions.push({
          type: 'calldata_optimization',
          priority: 'medium',
          title: 'Calldata Optimization (Heuristic)',
          description: 'Detected memory array parameter(s) in a function signature; prefer calldata for read-only functions',
          gas_savings: '3000 gas per call',
          recommendation: 'Replace memory arrays with calldata for read-only functions',
          impact: 'Medium',
        });
      }
    }

    return suggestions;
  } catch {
    return [];
  }
}
