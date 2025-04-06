import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("MockReverter", function () {
  async function fixture() {
    const MockReverter = await ethers.getContractFactory("MockReverter");

    const reverter = await MockReverter.deploy();

    return { reverter };
  }

  before(async function () {
    await loadFixture(fixture);
  });

  describe("panicOutOfBound", function () {
    it("should be reverted with panic", async function () {
      const { reverter } = await loadFixture(fixture);

      await expect(reverter.panicOutOfBound()).to.be.revertedWithPanic(0x32);
    });
  });

  describe("revertYay", function () {
    it("should be reverted with Yay", async function () {
      const { reverter } = await loadFixture(fixture);

      await expect(reverter.revertYay()).to.be.revertedWith("Yay");
    });
  });

  describe("revertWithoutReason", function () {
    it("should be reverted without reason", async function () {
      const { reverter } = await loadFixture(fixture);

      // NOTE: ethers bug
      //  https://github.com/ethers-io/ethers.js/issues/3605
      //  https://github.com/ethers-io/ethers.js/issues/3038
      await expect(
        reverter.signer.sendTransaction(await reverter.populateTransaction.revertWithoutReason())
      ).to.be.revertedWithoutReason();
    });
  });
});
