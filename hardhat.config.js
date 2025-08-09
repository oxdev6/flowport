require('dotenv').config();
require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-verify');
require('@typechain/hardhat');

const { PRIVATE_KEY, ETH_RPC_URL, ARB_RPC_URL, ARBISCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    hardhat: {
      forking: ARB_RPC_URL
        ? {
            url: ARB_RPC_URL,
            chainId: 421614
          }
        : undefined
    },
    localhost: {
      url: 'http://127.0.0.1:8545'
    },
    sepolia: {
      url: ETH_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    },
    arbitrumSepolia: {
      url: ARB_RPC_URL || 'https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY',
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: ARBISCAN_API_KEY || 'YOUR_ARBISCAN_API_KEY'
    }
  },
  typechain: {
    outDir: 'types',
    target: 'ethers-v6'
  }
};



