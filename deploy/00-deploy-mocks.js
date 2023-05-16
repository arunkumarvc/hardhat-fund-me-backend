const { network } = require("hardhat");
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    // 4.2.
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...");
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            args: [DECIMALS, INITIAL_ANSWER],
            log: true,
        });
        log("Mocks deployed!");
        log("--------------------------------------------------");
    }
};

// yarn hardhat deploy --tags mocks
// it will only run the deploy script that has a special tags
module.exports.tags = ["all", "mocks"];
