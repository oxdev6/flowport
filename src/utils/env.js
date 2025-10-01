import chalk from 'chalk';

function isHexPrivateKey(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{64}$/.test(value);
}

function validateEnv({ requirePrivateKey = false } = {}) {
  const issues = [];
  const { PRIVATE_KEY, ETH_RPC_URL, ARB_RPC_URL, ARBISCAN_API_KEY, ARBITRUM_ONE_RPC_URL } = process.env;
  const ARBITRUM_MAINNET_URL = ARBITRUM_ONE_RPC_URL || process.env.ARBITRUM_RPC_URL;

  if (requirePrivateKey) {
    if (!PRIVATE_KEY) issues.push('PRIVATE_KEY is missing');
    else if (!isHexPrivateKey(PRIVATE_KEY)) issues.push('PRIVATE_KEY must be 0x-prefixed 64-hex');
  }

  if (!ETH_RPC_URL) issues.push('ETH_RPC_URL is missing (optional unless using L1 ops)');
  if (!ARB_RPC_URL) issues.push('ARB_RPC_URL is missing for Arbitrum Sepolia');
  if (!ARBITRUM_MAINNET_URL) issues.push('ARBITRUM_ONE_RPC_URL (or ARBITRUM_RPC_URL) is missing for Arbitrum One');
  if (!ARBISCAN_API_KEY) issues.push('ARBISCAN_API_KEY is missing (optional, needed for verify)');

  const ok = issues.length === 0;
  return { ok, issues };
}

function printEnvReport({ requirePrivateKey = false } = {}) {
  const { ok, issues } = validateEnv({ requirePrivateKey });
  if (ok) {
    console.log(chalk.green('Environment looks good.'));
  } else {
    console.log(chalk.yellow('Environment check found issues:'));
    for (const m of issues) console.log('-', m);
    console.log('\nSet variables in a .env file or export them in your shell. See .env.example');
  }
  return ok;
}

export { validateEnv, printEnvReport };


