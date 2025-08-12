require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");

const enableGas = process.env.REPORT_GAS === "true";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  gasReporter: {
    enabled: enableGas,
    currency: "USD",
  },
  mocha: {
    // reporter: "spec", // clean output
  },
};
