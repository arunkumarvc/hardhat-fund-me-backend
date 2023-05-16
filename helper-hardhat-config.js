// We define If chainId is A use address B (for AggregatorV3Interface priceFeed which gives us the price of the different blockchains)

const networkConfig = {
    11155111: {
        name: "sepolia",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    },
    80001: {
        name: "mumbai",
        ethUsdPriceFeed: "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
    },
};

// 4.1.
const developmentChains = ["hardhat", "localhost"];
// for MockV3Aggregator.sol constructor takes two parameter (node_modules/@chainlink/contracts/src/v0.8/tests/MockV3Aggregator.sol) used in 00-deploy-mocks.js
const DECIMALS = 8;
const INITIAL_ANSWER = 200000000000; // priceFeed starting price

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
};
