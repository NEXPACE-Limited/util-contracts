import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ContractTransaction } from "ethers";
import { MockNextOwnable } from "../../typechain-types";
import nxErrors from "../lib/nx-errors";

describe("NextOwnable", function () {
  async function fixture() {
    const [owner, alice, carol, malory] = await ethers.getSigners();

    const MockNextOwnable = await ethers.getContractFactory("MockNextOwnable", owner);

    const contract = await MockNextOwnable.deploy();

    await contract.grantExecutor(await alice.getAddress());

    return { owner, contract, alice, carol, malory };
  }

  function onlyOwner(
    cb: (
      contract: MockNextOwnable,
      fixtureReturn: Awaited<ReturnType<typeof fixture>>
    ) => Promise<ContractTransaction | void>,
    name: string
  ) {
    it("should not be reverted when called by the owner", async function () {
      const f = await loadFixture(fixture);
      const { contract } = f;

      await expect(cb(contract, f), `${name} transaction`).not.to.be.reverted;
    });

    it("should be reverted when not called by the owner", async function () {
      const f = await loadFixture(fixture);
      const { contract, malory } = f;

      await expect(cb(contract.connect(malory), f), `${name} transaction`).to.be.revertedWith(nxErrors.ownerForbidden);
    });

    it("should be reverted even when called by an executor", async function () {
      const f = await loadFixture(fixture);
      const { contract, alice } = f;

      await expect(cb(contract.connect(alice), f), `${name} transaction`).to.be.revertedWith(nxErrors.ownerForbidden);
    });
  }

  // preload fixture
  before(async function () {
    await loadFixture(fixture);
  });

  describe("isExecutor", function () {
    it("should not the owner", async function () {
      const { contract, owner } = await loadFixture(fixture);

      expect(await contract.isExecutor(await owner.getAddress()), "owner is an executor").to.be.false;
    });

    it("should the granted executors", async function () {
      const { contract, alice } = await loadFixture(fixture);

      expect(await contract.isExecutor(await alice.getAddress()), "alice is an executor").to.be.true;
    });

    it("should not a random address", async function () {
      const { contract, malory } = await loadFixture(fixture);

      expect(await contract.isExecutor(await malory.getAddress()), "alice is an executor").to.be.false;
    });
  });

  describe("isAtLeastExecutor", function () {
    it("should the owner", async function () {
      const { contract, owner } = await loadFixture(fixture);

      expect(await contract.isAtLeastExecutor(await owner.getAddress()), "owner is at least executor").to.be.true;
    });

    it("should executors", async function () {
      const { contract, alice } = await loadFixture(fixture);

      expect(await contract.isAtLeastExecutor(await alice.getAddress()), "alice is at least executor").to.be.true;
    });

    it("should not a random address", async function () {
      const { contract, malory } = await loadFixture(fixture);

      expect(await contract.isAtLeastExecutor(await malory.getAddress()), "bob is at least executor").to.be.false;
    });
  });

  describe("onlyOwner", function () {
    onlyOwner(async (contract) => contract.testOnlyOwner(), "onlyOwner");
  });

  describe("onlyAtLeastExecutor", function () {
    it("should not be reverted when called by an executor", async function () {
      const { contract, alice } = await loadFixture(fixture);

      await expect(contract.connect(alice).testOnlyAtLeastExecutor(), "onlyAtLeastExecutor transaction").not.to.be
        .reverted;
    });

    it("should not be reverted even when called by the owner", async function () {
      const { contract } = await loadFixture(fixture);

      await expect(contract.testOnlyAtLeastExecutor(), "onlyAtLeastExecutor transaction").not.to.be.reverted;
    });

    it("should be reverted when called by other", async function () {
      const { contract, malory } = await loadFixture(fixture);

      await expect(
        contract.connect(malory).testOnlyAtLeastExecutor(),
        "onlyAtLeastExecutor transaction"
      ).to.be.revertedWith(nxErrors.executorForbidden);
    });
  });

  describe("checkOwner", function () {
    it("should not be reverted for the owner", async function () {
      const { contract, owner } = await loadFixture(fixture);

      await expect(contract.checkOwner(await owner.getAddress()), "checkOwner transaction").not.to.be.reverted;
    });

    it("should be reverted for a random address", async function () {
      const { contract, malory } = await loadFixture(fixture);

      await expect(contract.checkOwner(await malory.getAddress()), "checkOwner transaction").to.be.revertedWith(
        nxErrors.ownerForbidden
      );
    });

    it("should be reverted even for an executor", async function () {
      const { contract, alice } = await loadFixture(fixture);

      await expect(contract.checkOwner(await alice.getAddress()), "checkOwner transaction").to.be.revertedWith(
        nxErrors.ownerForbidden
      );
    });
  });

  describe("checkAtLeastExecutor", function () {
    it("should not be reverted for an executor", async function () {
      const { contract, alice } = await loadFixture(fixture);

      await expect(contract.checkAtLeastExecutor(await alice.getAddress()), "checkAtLeastExecutor transaction").not.to
        .be.reverted;
    });

    it("should not be reverted for the owner", async function () {
      const { contract, owner } = await loadFixture(fixture);

      await expect(contract.checkAtLeastExecutor(await owner.getAddress()), "checkAtLeastExecutor transaction").not.to
        .be.reverted;
    });

    it("should be reverted for other", async function () {
      const { contract, malory } = await loadFixture(fixture);

      await expect(
        contract.checkAtLeastExecutor(await malory.getAddress()),
        "checkAtLeastExecutor transaction"
      ).to.be.revertedWith(nxErrors.executorForbidden);
    });
  });

  describe("grantExecutor", function () {
    onlyOwner(async (contract, { carol }) => contract.grantExecutor(await carol.getAddress()), "grantExecutor");

    it("should grant executor on success", async function () {
      const { contract, carol } = await loadFixture(fixture);

      await contract.grantExecutor(await carol.getAddress());

      expect(await contract.isExecutor(await carol.getAddress()), "carol is an executor after grant").to.be.true;
    });

    it("should emit event on grant", async function () {
      const { contract, carol } = await loadFixture(fixture);

      await expect(contract.grantExecutor(await carol.getAddress()), "grantExecutor transaction")
        .to.emit(contract, "ExecutorGranted")
        .withArgs(await carol.getAddress());
    });

    it("should be reverted when already granted", async function () {
      const { contract, alice } = await loadFixture(fixture);

      await expect(contract.grantExecutor(await alice.getAddress()), "grantExecutor transaction").to.be.revertedWith(
        nxErrors.grantExecutorConflict
      );
    });
  });

  describe("revokeExecutor", function () {
    onlyOwner(async (contract, { alice }) => contract.revokeExecutor(await alice.getAddress()), "revokeExecutor");

    it("should revoke executor on success", async function () {
      const { contract, alice } = await loadFixture(fixture);

      await contract.revokeExecutor(await alice.getAddress());

      expect(await contract.isExecutor(await alice.getAddress()), "alice is an executor after grant").to.be.false;
    });

    it("should emit event on revoke", async function () {
      const { contract, alice } = await loadFixture(fixture);

      await expect(contract.revokeExecutor(await alice.getAddress()), "revokeExecutor transaction")
        .to.emit(contract, "ExecutorRevoked")
        .withArgs(await alice.getAddress());
    });

    it("should be reverted when already revoke", async function () {
      const { contract, carol } = await loadFixture(fixture);

      await expect(contract.revokeExecutor(await carol.getAddress()), "revokeExecutor transaction").to.be.revertedWith(
        nxErrors.revokeExecutorConflict
      );
    });
  });
});
