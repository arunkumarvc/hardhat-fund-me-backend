/* 
const helperConfig = require("../helper-hardhat-config");
const networkConfig = helperConfig.networkConfig
*/
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("..//utils/verify");
require("dotenv").config();

//  getNamedAccounts, deployments are abstracted from hre
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments;
    // taking from hardhat.config getNamedAccounts.deployer account
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // 3. If chainId is A use address B. we can use the priceFeed address based on the chain we'e on. helper-hardhat-config.js
    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    // for example: If we call yarn hardhat deploy --network sepolia, it will go to hardhat.config.js networks sepolia, from there it'll go to helper-hardhat-config.js

    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    // 1. Depend on the network, it dynamically changes to different blockchains priceFeed address (check FundMe.sol)

    // 4. Using Mocks. If blockchain doesn't even have a priceFeed address on it (localhost & hardhat network) this is were we use mocks.
    /* 
    Chainlink has priceFeed addresses for only mainnet and testnets.
    When going for localhost or hardhat network we want to use a mock
    The idea of mocking here is, if the contract doesn't exist, we deploy a minimal version for our local testing
    Deploy mock is technically a deploy script.
    
    */

    // 2. Deploying the contract
    /*   const nameOfOurContract = await deploy("name of the contract that we're deploying", { list of overrides,
        from: Who is deploying this contract,
        args:[arguments to the constructor function (priceFeed address)],
        log: custom logging, we don't want to do the console.log() })  */
    const args = [ethUsdPriceFeedAddress];

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // address of the priceFeed
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    // verify
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }

    log("--------------------------------------------------");
};
module.exports.tags = ["all", "fundme"];
