// import
// main function
// calling of main function

// gets the networkConfig from hardhat-helper-config
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

// note the above with the curly brackets is exactly the same as executing the following two lines of code:
//const helperConfig = require("../helper-hardhat-config")
//const networkConfig = helperConfig.networkConfig

// if the contract doesn't exist, we deploy a minimal version of it for our local testing

// this sets up an anon async function
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // if chainId is x use address y
  // if chainId is z use address a
  //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]; // here's where we use networkConfig from earlier
  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    // if we're on a local dev chain, use the mock price feed
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    // if we're on a testnet, use a chainlink price feed
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  // well what happens when we want to change chains?
  // when going for localhost or hardhat network we want to use a mock
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // put price feed address in here
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }

  log("-------------------------------------------------------");
}; // most efficient way to write this using syntatic sugar!

module.exports.tags = ["all", "fundme"];

// alt way to define this func [does exactly the same thing but less efficient]

// function deployFunc() {
//   console.log("Hi!");
// }

// module.exports.default = deployFunc;
