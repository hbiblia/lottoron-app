require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545", // Red simulada de Hardhat
    },
    ronin: {
      url: process.env.RONIN_API_URL,
      chainId: 2020, // Ronin Mainnet
      accounts: [`${process.env.RONIN_PRIVATE_KEY}`],
    },
  },
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    cache: "./cache",
    tests: "./test",
  },
};
