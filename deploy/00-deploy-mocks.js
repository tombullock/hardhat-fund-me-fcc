// if we're on a local network that doesn't have price-feed contracts (like Rinkeby or Polygon) we can set up our own "mock" contracts to simulate those price feeds
const { network } = require("hardhat");
const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...");
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER], // see contructor for the chainlink MockV3Aggregator contract: decimals first, init answer second!
    });
    log("Mocks Deployed!");
    log("---------------------------------------------");
  }
};

module.exports.tags = ["all", "mocks"];
