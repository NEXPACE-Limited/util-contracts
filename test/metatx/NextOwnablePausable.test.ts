import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { sendMetaTransaction } from "../lib/metatx";
import nxErrors from "../lib/nx-errors";

describe("meta-transaction NextOwnablePausable", function () {
  async function fixture() {
    const [owner, alice, malory, forwarder] = await ethers.getSigners();

    const [MockERC2771NextOwnablePausable] = await Promise.all([
      ethers.getContractFactory("MockERC2771NextOwnablePausable", owner),
    ]);

    const [contract] = await Promise.all([MockERC2771NextOwnablePausable.deploy(await forwarder.getAddress())]);
    await Promise.all([contract.grantExecutor(await alice.getAddress())]);

    return { contract, forwarder, owner, alice, malory };
  }

  // preload fixture
  before(async function () {
    await loadFixture(fixture);
  });

  describe("pause", function () {
    it("should pause when forwarded sender is an executor", async function () {
      const { contract, forwarder, alice } = await loadFixture(fixture);

      await sendMetaTransaction(forwarder, await alice.getAddress(), await contract.populateTransaction.pause());

      expect(await contract.paused(), "paused").to.be.true;
    });

    it("should pause even when forwarded sender is the owner", async function () {
      const { owner, contract, forwarder } = await loadFixture(fixture);

      await sendMetaTransaction(forwarder, await owner.getAddress(), await contract.populateTransaction.pause());

      expect(await contract.paused(), "paused").to.be.true;
    });

    it("should be reverted when forwarded sender is neither the owner nor an executor", async function () {
      const { contract, forwarder, malory } = await loadFixture(fixture);

      await expect(
        sendMetaTransaction(forwarder, await malory.getAddress(), await contract.populateTransaction.pause())
      ).to.be.revertedWith(nxErrors.executorForbidden);
    });
  });

  describe("unpause", function () {
    it("should unpause when forwarded sender is the owner", async function () {
      const { contract, forwarder, owner } = await loadFixture(fixture);
      await contract.pause();

      await sendMetaTransaction(forwarder, await owner.getAddress(), await contract.populateTransaction.unpause());

      expect(await contract.paused(), "paused").to.be.false;
    });

    it("should be reverted when forwarded sender is not the owner", async function () {
      const { contract, forwarder, malory } = await loadFixture(fixture);
      await contract.pause();

      await expect(
        sendMetaTransaction(forwarder, await malory.getAddress(), await contract.populateTransaction.unpause())
      ).to.be.revertedWith(nxErrors.ownerForbidden);
    });
  });

  describe("whenExecutable", function () {
    it("should be reverted when forwarded sender is an executor and the contract is paused", async function () {
      const { contract, forwarder, alice } = await loadFixture(fixture);
      await contract.pause();

      await expect(
        sendMetaTransaction(
          forwarder,
          await alice.getAddress(),
          await contract.populateTransaction.testWhenExecutable()
        )
      ).to.be.revertedWith(nxErrors.paused);
    });

    it("should not be reverted when forwarded sender is the owner even when paused", async function () {
      const { contract, forwarder, owner } = await loadFixture(fixture);
      await contract.pause();

      await expect(
        sendMetaTransaction(
          forwarder,
          await owner.getAddress(),
          await contract.populateTransaction.testWhenExecutable()
        )
      ).not.to.be.reverted;
    });
  });
});
