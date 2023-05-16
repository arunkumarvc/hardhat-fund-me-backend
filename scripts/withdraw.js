const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Funding Contract...");
    const transactionResponse = await fundMe.withdraw();
    await transactionResponse.wait(1);
    console.log("Got it back!");

    const endingDeployerBalance = (
        await fundMe.provider.getBalance(deployer)
    ).toString();
    console.log(`Available Balance: ${endingDeployerBalance}`);
}

// main
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });

// yarn hardhat node
// yarn hardhat run scripts/withdraw.js --network localhost
