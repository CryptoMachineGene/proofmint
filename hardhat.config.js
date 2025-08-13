// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");
require("dotenv").config();

// Read env once; support the accidental 'SEP0LIA' spelling too.
const {
  SEPOLIA_RPC_URL: SEPOLIA_A,
  SEP0LIA_RPC_URL: SEPOLIA_B, // fallback if you typed a zero earlier
  DEPLOYER_PRIVATE_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

const sepoliaUrl = SEPOLIA_A || SEPOLIA_B || "";

// Only pass an account if it's a valid 32-byte hex (0x + 64 chars).
const isValidPk = /^0x[0-9a-fA-F]{64}$/.test(DEPLOYER_PRIVATE_KEY || "");
const sepoliaAccounts = isValidPk ? [DEPLOYER_PRIVATE_KEY] : undefined;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  gasReporter: { enabled: process.env.REPORT_GAS === "true", currency: "USD" },
  networks: {
    sepolia: {
      url: sepoliaUrl,
      // if the key is invalid/missing, we omit 'accounts' entirely so compile/test still work
      ...(sepoliaAccounts ? { accounts: sepoliaAccounts } : {}),
    },
  },
  etherscan: { apiKey: ETHERSCAN_API_KEY || "" },
};
