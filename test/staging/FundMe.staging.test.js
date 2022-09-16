// tests we will run on testnet right before we deploy to a mainnet
const { inputToConfig } = require("@ethereum-waffle/compiler");
const { assert } = require("chai");
const { getNamedAccounts, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip //note the ? and : is essentially just an "if" statement
  : describe("FundMe", async function () {
      // run this ONLY if we're not on a development chain (i.e. we are on test/main net)
      let fundMe;
      let deployer;
      const sendValue = ethers.utils.parseEther("1");
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract("FundMe", deployer);
      });

      it("allows people to fund and withdraw", async function () {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw();
        const endingBalance = await fundMe.provider.getBalance(fundMe.address);
        assert.equal(endingBalance.toString(), "0");
      });
    });
