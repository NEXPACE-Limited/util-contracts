import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { PopulatedTransaction } from "ethers";
import { MockNextOwnable } from "../../typechain-types";
import { sendMetaTransaction } from "../lib/metatx";
import nxErrors from "../lib/nx-errors";

describe("meta-transaction NextOwnable", function () {
  async function fixture() {
    const [owner, alice, carol, malory, forwarder] = await ethers.getSigners();

    const MockERC2771NextOwnable = await ethers.getContractFactory("MockERC2771NextOwnable", owner);

    const contract = await MockERC2771NextOwnable.deploy(await forwarder.getAddress());

    await contract.grantExecutor(await alice.getAddress());

    return { contract, forwarder, owner, alice, carol, malory };
  }

  function onlyOwner(
    cb: (
      contract: MockNextOwnable,
      fixtureReturn: Awaited<ReturnType<typeof fixture>>
    ) => Promise<PopulatedTransaction>,
    name: string
  ) {
    it("should not be reverted when called by the owner", async function () {
      const f = await loadFixture(fixture);
      const { contract, owner } = f;

      await expect(owner.sendTransaction(await cb(contract, f)), `${name} transaction`).not.to.be.reverted;
    });

    it("should be reverted when not called by the owner", async function () {
      const f = await loadFixture(fixture);
      const { contract, malory } = f;

      await expect(
        malory.sendTransaction(await cb(contract.connect(malory), f)),
        `${name} transaction`
      ).to.be.revertedWith(nxErrors.ownerForbidden);
    });

    it("should not be reverted when forwarded sender is the owner", async function () {
      const f = await loadFixture(fixture);
      const { contract, forwarder, owner } = f;

      await expect(
        sendMetaTransaction(forwarder, await owner.getAddress(), await cb(contract, f)),
        `${name} transaction`
      ).not.to.be.reverted;
    });

    it("should be reverted when forwarded sender is not the owner", async function () {
      const f = await loadFixture(fixture);
      const { contract, forwarder, malory } = f;

      await expect(
        sendMetaTransaction(forwarder, await malory.getAddress(), await cb(contract, f)),
        `${name} transaction`
      ).to.be.revertedWith(nxErrors.ownerForbidden);
    });

    it("should not be reverted when illegally forwarded by the owner", async function () {
      const f = await loadFixture(fixture);
      const { contract, owner, malory } = f;

      await expect(sendMetaTransaction(owner, await malory.getAddress(), await cb(contract, f)), `${name} transaction`)
        .not.to.be.reverted;
    });

    it("should be reverted even when illegally forwarded by a non-owner", async function () {
      const f = await loadFixture(fixture);
      const { contract, owner, malory } = f;

      await expect(
        sendMetaTransaction(malory, await owner.getAddress(), await cb(contract, f)),
        `${name} transaction`
      ).to.be.revertedWith(nxErrors.ownerForbidden);
    });
  }

  // preload fixture
  before(async function () {
    await loadFixture(fixture);
  });

  describe("onlyOwner", function () {
    onlyOwner(async (contract) => contract.populateTransaction.testOnlyOwner(), "onlyOwner");
  });

  describe("onlyAtLeastExecutor", function () {
    it("should not be reverted when forwarded sender is an executor", async function () {
      const { contract, forwarder, alice } = await loadFixture(fixture);

      await expect(
        sendMetaTransaction(
          forwarder,
          await alice.getAddress(),
          await contract.populateTransaction.testOnlyAtLeastExecutor()
        ),
        "onlyAtLeastExecutor transaction"
      ).not.to.be.reverted;
    });

    it("should not be reverted even when forwarded sender is the owner", async function () {
      const { contract, forwarder, owner } = await loadFixture(fixture);

      await expect(
        sendMetaTransaction(
          forwarder,
          await owner.getAddress(),
          await contract.populateTransaction.testOnlyAtLeastExecutor()
        ),
        "onlyAtLeastExecutor transaction"
      ).not.to.be.reverted;
    });

    it("should be reverted when forwarded sender is neither the owner nor an executor", async function () {
      const { contract, forwarder, malory } = await loadFixture(fixture);

      await expect(
        sendMetaTransaction(
          forwarder,
          await malory.getAddress(),
          await contract.populateTransaction.testOnlyAtLeastExecutor()
        ),
        "onlyAtLeastExecutor transaction"
      ).to.be.revertedWith(nxErrors.executorForbidden);
    });
  });

  describe("grantExecutor", function () {
    onlyOwner(
      async (contract, { carol }) => contract.populateTransaction.grantExecutor(await carol.getAddress()),
      "grantExecutor"
    );

    it("should grant executor when forwarded sender is the owner", async function () {
      const { contract, forwarder, owner, carol } = await loadFixture(fixture);

      await sendMetaTransaction(
        forwarder,
        await owner.getAddress(),
        await contract.populateTransaction.grantExecutor(await carol.getAddress())
      );

      expect(await contract.isExecutor(await carol.getAddress()), "carol is an executor after grant").to.be.true;
    });
  });

  describe("revokeExecutor", function () {
    onlyOwner(
      async (contract, { alice }) => contract.populateTransaction.revokeExecutor(await alice.getAddress()),
      "revokeExecutor"
    );

    it("should revoke executor when forwarded sender is the owner", async function () {
      const { contract, forwarder, owner, alice } = await loadFixture(fixture);

      await sendMetaTransaction(
        forwarder,
        await owner.getAddress(),
        await contract.populateTransaction.revokeExecutor(await alice.getAddress())
      );

      expect(await contract.isExecutor(await alice.getAddress()), "alice is an executor after grant").to.be.false;
    });
  });
});
