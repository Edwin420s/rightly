require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SCROLL_RPC = process.env.SCROLL_RPC || "https://sepolia-rpc.scroll.io";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    scrollTestnet: {
      url: SCROLL_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 534351
    },
    scrollMainnet: {
      url: "https://rpc.scroll.io",
      accounts: [PRIVATE_KEY],
      chainId: 534352
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  etherscan: {
    apiKey: {
      scrollTestnet: process.env.SCROLLSCAN_API_KEY || "abc",
      scrollMainnet: process.env.SCROLLSCAN_API_KEY || "abc"
    },
    customChains: [
      {
        network: "scrollTestnet",
        chainId: 534351,
        urls: {
          apiURL: "https://sepolia-blockscout.scroll.io/api",
          browserURL: "https://sepolia-blockscout.scroll.io"
        }
      },
      {
        network: "scrollMainnet",
        chainId: 534352,
        urls: {
          apiURL: "https://blockscout.scroll.io/api",
          browserURL: "https://blockscout.scroll.io"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  }
};