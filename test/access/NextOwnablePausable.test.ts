import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import nxErrors from "../lib/nx-errors";

describe("NextOwnablePausable", function () {
  async function fixture() {
    const [owner, alice, malory] = await ethers.getSigners();

    const [MockNextOwnablePausable] = await Promise.all([ethers.getContractFactory("MockNextOwnablePausable", owner)]);

    const [contract] = await Promise.all([MockNextOwnablePausable.deploy()]);
    await Promise.all([contract.grantExecutor(await alice.getAddress())]);

    return { contract, owner, alice, malory };
  }

  // preload fixture
  before(async function () {
    await loadFixture(fixture);
  });

  describe("pause", function () {
    it("should pause when called by the owner", async function () {
      const { contract } = await loadFixture(fixture);

      await contract.pause();

      expect(await contract.paused(), "paused").to.be.true;
    });

    it("should pause when called by an executor", async function () {
      const { contract, alice } = await loadFixture(fixture);

      await contract.connect(alice).pause();

      expect(await contract.paused(), "paused").to.be.true;
    });

    it("should be reverted when called by others", async function () {
      const { contract, malory } = await loadFixture(fixture);

      await expect(contract.connect(malory).pause()).to.be.revertedWith(nxErrors.executorForbidden);
    });
  });

  describe("unpause", function () {
    it("should unpause when called by the owner", async function () {
      const { contract } = await loadFixture(fixture);
      await contract.pause();

      await contract.unpause();

      expect(await contract.paused(), "paused").to.be.false;
    });

    it("should be reverted even when called by an executor", async function () {
      const { contract, alice } = await loadFixture(fixture);
      await contract.pause();

      await expect(contract.connect(alice).unpause()).to.be.revertedWith(nxErrors.ownerForbidden);
    });

    it("should be reverted when called by others", async function () {
      const { contract, malory } = await loadFixture(fixture);
      await contract.pause();

      await expect(contract.connect(malory).unpause()).to.be.revertedWith(nxErrors.ownerForbidden);
    });
  });

  describe("whenPaused", function () {
    it("should not be reverted when paused", async function () {
      const { contract } = await loadFixture(fixture);
      await contract.pause();

      await expect(contract.testWhenPaused(), "whenPaused").not.to.be.reverted;
    });

    it("should be reverted when not paused", async function () {
      const { contract } = await loadFixture(fixture);

      await expect(contract.testWhenPaused(), "whenPaused").to.be.revertedWith(nxErrors.notPaused);
    });
  });

  describe("whenNotPaused", function () {
    it("should not be reverted when not paused", async function () {
      const { contract } = await loadFixture(fixture);

      await expect(contract.testWhenNotPaused(), "whenNotPaused").not.to.be.reverted;
    });

    it("should be reverted when paused", async function () {
      const { contract } = await loadFixture(fixture);
      await contract.pause();

      await expect(contract.testWhenNotPaused(), "whenNotPaused").to.be.revertedWith(nxErrors.paused);
    });
  });

  describe("checkPaused", function () {
    it("should not be reverted when paused", async function () {
      const { contract } = await loadFixture(fixture);
      await contract.pause();

      await expect(contract.checkPaused(), "checkPaused").not.to.be.reverted;
    });

    it("should be reverted when not paused", async function () {
      const { contract } = await loadFixture(fixture);

      await expect(contract.checkPaused(), "checkPaused").to.be.revertedWith(nxErrors.notPaused);
    });
  });

  describe("checkNotPaused", function () {
    it("should not be reverted when not paused", async function () {
      const { contract } = await loadFixture(fixture);

      await expect(contract.checkNotPaused(), "checkNotPaused").not.to.be.reverted;
    });

    it("should be reverted when paused", async function () {
      const { contract } = await loadFixture(fixture);
      await contract.pause();

      await expect(contract.checkNotPaused(), "checkNotPaused").to.be.revertedWith(nxErrors.paused);
    });
  });

  describe("whenExecutable", function () {
    it("should be reverted when paused", async function () {
      const { contract, alice } = await loadFixture(fixture);
      await contract.pause();

      await expect(contract.connect(alice).testWhenExecutable()).to.be.revertedWith(nxErrors.paused);
    });

    it("should not be reverted for owner", async function () {
      const { contract, owner } = await loadFixture(fixture);

      await expect(contract.connect(owner).testWhenExecutable()).not.to.be.reverted;
    });

    it("should not be reverted for owner even when paused", async function () {
      const { contract, owner } = await loadFixture(fixture);
      await contract.pause();

      await expect(contract.connect(owner).testWhenExecutable()).not.to.be.reverted;
    });

    it("should not be reverted for executor", async function () {
      const { contract, alice } = await loadFixture(fixture);

      await expect(contract.connect(alice).testWhenExecutable()).not.to.be.reverted;
    });

    it("should be reverted for others", async function () {
      const { contract, malory } = await loadFixture(fixture);

      await expect(contract.connect(malory).testWhenExecutable()).to.be.revertedWith(nxErrors.executorForbidden);
    });
  });

  describe("checkExecutable", function () {
    it("should be reverted when paused", async function () {
      const { contract, alice } = await loadFixture(fixture);
      await contract.pause();

      await expect(contract.checkExecutable(await alice.getAddress())).to.be.revertedWith(nxErrors.paused);
    });

    it("should not be reverted for owner", async function () {
      const { contract, owner } = await loadFixture(fixture);

      await expect(contract.checkExecutable(await owner.getAddress())).not.to.be.reverted;
    });

    it("should not be reverted for owner even when paused", async function () {
      const { contract, owner } = await loadFixture(fixture);
      await contract.pause();

      await expect(contract.checkExecutable(await owner.getAddress())).not.to.be.reverted;
    });

    it("should not be reverted for executor", async function () {
      const { contract, alice } = await loadFixture(fixture);

      await expect(contract.checkExecutable(await alice.getAddress())).not.to.be.reverted;
    });

    it("should be reverted for others", async function () {
      const { contract, malory } = await loadFixture(fixture);

      await expect(contract.checkExecutable(await malory.getAddress())).to.be.revertedWith(nxErrors.executorForbidden);
    });
  });

  describe("isExecutable", function () {
    it("should return false when paused", async function () {
      const { contract, alice } = await loadFixture(fixture);
      await contract.pause();

      expect(await contract.isExecutable(await alice.getAddress())).to.be.false;
    });

    it("should return true for owner", async function () {
      const { contract, owner } = await loadFixture(fixture);

      expect(await contract.isExecutable(await owner.getAddress())).to.be.true;
    });

    it("should return true for owner even when paused", async function () {
      const { contract, owner } = await loadFixture(fixture);
      await contract.pause();

      expect(await contract.isExecutable(await owner.getAddress())).to.be.true;
    });

    it("should return true for executor", async function () {
      const { contract, alice } = await loadFixture(fixture);

      expect(await contract.isExecutable(await alice.getAddress())).to.be.true;
    });

    it("should return false for others", async function () {
      const { contract, malory } = await loadFixture(fixture);

      expect(await contract.isExecutable(await malory.getAddress())).to.be.false;
    });
  });
});
