// Where ever we're gonna deploy our fundMe contract we first pull deployments from hardhat
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          // const sendValue = "1000000000000000000" // 1ETH
          const sendValue = ethers.utils.parseEther("1"); // 1ETH, parseEther utility converts the "1" to "1000000000000000000"
          beforeEach(async function () {
              // deploy our fundMe contract here using Hardhat-deploy

              // 3. we can also tell ethers which account we want connected to fundMe.
              // const { deployer } = await getNamedAccounts();
              deployer = (await getNamedAccounts()).deployer; // same as above but we're storing in variable to use again

              //  Another way you can get different accounts directly from hardhat.config.ethers.getSigners is going to return whatever is in the account section ( accounts: [PRIVATE_KEY],) of our network. If we're on our default network hardhat, it's going to give us a list of 10 fake accounts that we can work with
              // const accounts = await ethers.getSigners();
              // const accountZero = accounts[0];

              // 1. Deploying
              // deployments objects has a function called fixture. fixture allows us to run our entire deploy folder with as many tags(module.exports.tags) as we want.
              // fixture  will run through our deploy scripts on our local network and deploy all of the contracts, that we can use them in our scripts and in our testing. we can deploy everything in our deploy folder with just this line
              await deployments.fixture("all");

              // 2. Getting the deployed contract
              // once all of our contracts have been deployed, we can start getting them. hardhat deploy wraps ethers with a function called GetContract, this GetContract function is going to get the most recent deployment of whatever contract we tell it. So this will give us the most recently deployed FundMe contract in just this one line.
              fundMe = await ethers.getContract("FundMe", deployer);

              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async function () {
                  // calling getPriceFeed() from FundMe.sol in hardhat network so this uses MockV3Aggregator.sol contract not the real AggregatorV3Interface.sol
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("fund", function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough!"
                  );
              });

              it("Updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  assert.equal(response.toString(), sendValue.toString());
              });

              it("Adds funder to array of Funder", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("withdraw", function () {
              beforeEach(async function () {
                  // funded 1 ETH to FundMe contract
                  await fundMe.fund({ value: sendValue });
              });

              it("withdraw ETH from a single funder", async function () {
                  // Arrange
                  // 1a. Checking FundMe and deployer balance before withdraw
                  // fundMe contract comes with a provider. we can also use ethers.provider.getBalance()
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // Act
                  // 2a. called Withdraw function
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  // Using debug we came to know that transactionReceipt has below functions
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  // 3a. Checking FundMe and deployer balance after calling withdraw function
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // Assert
                  // 4a. After withdraw the FundMe balance should be 0
                  assert.equal(endingFundMeBalance, 0);
                  // 4a.1. Starting FundMe + Deployer balance === Ending deployer balance + the gas used for withdraw
                  // example, 0 + 100 = 97 + 3
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
              });

              it("allows us to withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners();
                  // accounts indexed from 1 to 5
                  for (let i = 1; i < 6; i++) {
                      // fundMe contract connects with different accounts
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );

                  // making sure that the getFunder array are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  // making sure that all the mapping are updated properly
                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });

              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  );

                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
              });

              it("cheaperWithdraw testing...", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners();
                  // accounts indexed from 1 to 5
                  for (let i = 1; i < 6; i++) {
                      // fundMe contract connects with different accounts
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );

                  // making sure that the getFunder array are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  // making sure that all the mapping are updated properly
                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });
          });
      });

// % yarn hardhat test
// % yarn hardhat test --grep "funder to array"
