const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) // only run unit tests if we ARE on a dev chain
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe;
      let deployer;
      const sendValue = ethers.utils.parseEther("1"); // 1 ETH [this function convert 1e18 to 1 ETH for ease of use/reading - useful felxible function]
      beforeEach(async function () {
        // deploy our hardhat contract using hardhat-deploy
        // [following two lines are an alt way to get and specify an account]
        // const accounts = await ethers.getSigners();
        // const accountZero = accounts[0];
        deployer = (await getNamedAccounts()).deployer; // get deployer?!
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer); // gets most recent fundme contract [connected to deployer account]
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      // example of an "assert" test (must do something in order to pass test)
      describe("constructor", async function () {
        it("sets the aggregator address correctly", async function () {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      // example of a test that we expect to fail.  Here it fails because we pass empty funds!  NOTE had to run in terminal: yarn add --dev ethereum-waffle to get revertedWith to work!
      describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });
        it("updated the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
        it("Adds funder to array of getFunder", async function () {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunder(0);
          assert.equal(funder, deployer);
        });
      });

      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue }); // fund the contract first before testing the withdraw function (makes sense!)
        });
        it("Withdraw ETH from a single funder", async function () {
          // arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address // start with balance of contract after it's been funded with ETH
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer // get starting balance of the deployer
          );
          // act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          ); // has entire fundMe balance been added to the deployer balance?
          // gas cost [used debugger + breakpoints to find this out!]
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          // assert
          assert.equal(endingFundMeBalance, 0); // coz we took out all the money
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(), // use .add coz this is a bigNumber
            endingDeployerBalance.add(gasCost).toString() // need to compensate for the gas cost assoc with the withdrawal from the contract
          );
        });

        it("allows us to withdraw with multiple getFunder", async function () {
          // arrange
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address // start with balance of contract after it's been funded with ETH
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer // get starting balance of the deployer
          );

          // act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          // assert
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          assert.equal(endingFundMeBalance, 0); // coz we took out all the money
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(), // use .add coz this is a bigNumber
            endingDeployerBalance.add(gasCost).toString() // need to compensate for the gas cost assoc with the withdrawal from the contract
          );

          //make sure getFunder array is reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
        // unit test to ensure only the owner can withdraw from the contact
        it("Only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          ); // presents our custom error if reverted
        });
      });

      //HERE ON 09.01.22 - next upcoming module thing is "storage in solidity" at 11.44.33 in vid

      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue }); // fund the contract first before testing the withdraw function (makes sense!)
        });
        it("Withdraw ETH from a single funder", async function () {
          // arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address // start with balance of contract after it's been funded with ETH
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer // get starting balance of the deployer
          );
          // act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          ); // has entire fundMe balance been added to the deployer balance?
          // gas cost [used debugger + breakpoints to find this out!]
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          // assert
          assert.equal(endingFundMeBalance, 0); // coz we took out all the money
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(), // use .add coz this is a bigNumber
            endingDeployerBalance.add(gasCost).toString() // need to compensate for the gas cost assoc with the withdrawal from the contract
          );
        });

        it("cheaperWithdraw testing...", async function () {
          // arrange
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address // start with balance of contract after it's been funded with ETH
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer // get starting balance of the deployer
          );

          // act
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          // assert
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );
          assert.equal(endingFundMeBalance, 0); // coz we took out all the money
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(), // use .add coz this is a bigNumber
            endingDeployerBalance.add(gasCost).toString() // need to compensate for the gas cost assoc with the withdrawal from the contract
          );

          //make sure getFunder array is reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
        // unit test to ensure only the owner can withdraw from the contact
        it("Only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          ); // presents our custom error if reverted
        });
      });
    });
