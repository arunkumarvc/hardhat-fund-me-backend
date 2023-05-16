require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-solhint");
require("hardhat-deploy");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    // solidity: "0.8.18",
    //  in real world situation we often work with lower version solidity. Here we can define a list of versions to compile our .sol
    solidity: {
        compilers: [{ version: "0.8.18" }, { version: "0.6.6" }],
    },

    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            // accounts to use in sepolia
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            // we can add a section for each testnet for how many blocks we want to wait.
            blockConfirmations: 6,
        },
        mumbai: {
            url: MUMBAI_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 80001,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    // instead of adding accounts array in the networks, we can add accounts name here
    namedAccounts: {
        deployer: {
            // telling to use account array indexed 0 as default
            default: 0,
            // we can specify for different networks, sepolia use account 0 indexed
            // 11155111: 0,
        },
        user: {
            // we can also use different user for deployer
            default: 1,
        },
    },
    gasReporter: {
        enabled: true, // false to disable (below are optional)
        outputFile: "gas-report.txt", // creates new file & adds output data there
        noColors: true, // removes unwanted red color
        currency: "USD", // shows gas price in USD
        // coinmarketcap: COINMARKETCAP_API_KEY, // to get the current gas price
        token: "MATIC", // to check cost in other EVM blockchains
    },
};
