import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import nxErrors from "../lib/nx-errors";

describe("ApproveControlled", function () {
  async function fixture() {
    const [owner, alice, bob, user1, user2, nonUser] = await ethers.getSigners();

    const [MockApproveControlled, ApproveController] = await Promise.all([
      ethers.getContractFactory("MockApproveControlled", owner),
      ethers.getContractFactory("ApproveController", owner),
    ]);

    const controller = await ApproveController.deploy(ethers.constants.AddressZero);
    const [token1, token2] = await Promise.all([
      MockApproveControlled.deploy(controller.address),
      MockApproveControlled.deploy(controller.address),
      controller.connect(user1).setApprove(true),
      controller.connect(user2).setApprove(true),
    ]);

    return { controller, token1, token2, owner, alice, bob, user1, user2, nonUser, contract: token1, nonOwner: alice };
  }

  before(async function () {
    await loadFixture(fixture);
  });

  describe("controller", function () {
    it("should return initialized controller contract", async function () {
      const { controller, token1 } = await loadFixture(fixture);

      expect(await token1.controller()).to.eq(controller.address);
    });
  });

  describe("isApprovedOperator", function () {
    it("should return false for default value", async function () {
      const { token1, alice } = await loadFixture(fixture);

      expect(await token1.isApprovedOperator(await alice.getAddress())).to.be.false;
    });
  });

  describe("isApprover", function () {
    it("should return whether the account has approved to the controller", async function () {
      const { controller, token1, token2, user1, user2, nonUser } = await loadFixture(fixture);

      const nameMap = new Map([
        [user1, "user1"],
        [user2, "user2"],
        [nonUser, "nonUser"],
      ]);

      await Promise.all(
        [token1, token2].flatMap((token) =>
          [user1, user2, nonUser].map(async (signer) => {
            const address = signer.getAddress();
            return expect(await token.isApprover(address), `isApprover(${nameMap.get(signer)})`).to.eq(
              await controller.isApproved(address)
            );
          })
        )
      );
    });
  });

  describe("approveOperator", function () {
    it("should approve the account", async function () {
      const { token1, owner, alice } = await loadFixture(fixture);

      await token1.connect(owner).approveOperator(await alice.getAddress());

      expect(await token1.isApprovedOperator(await alice.getAddress())).to.be.true;
    });

    it("should emit correct event", async function () {
      const { token1, owner, alice } = await loadFixture(fixture);

      await expect(token1.connect(owner).approveOperator(await alice.getAddress()))
        .to.emit(token1, "OperatorApproved")
        .withArgs(await alice.getAddress());
    });

    it("should do nothing if already approved", async function () {
      const { token1, owner, alice } = await loadFixture(fixture);

      await token1.connect(owner).approveOperator(await alice.getAddress());

      await expect(
        token1.connect(owner).approveOperator(await alice.getAddress()),
        "approveOperator transaction"
      ).not.to.emit(token1, "OperatorApproved");

      expect(await token1.isApprovedOperator(await alice.getAddress()), "isApprovedOperator after approveOperator").to
        .be.true;
    });

    it("should be reverted when not called by owner", async function () {
      const { token1, alice } = await loadFixture(fixture);

      await expect(token1.connect(alice).approveOperator(await alice.getAddress())).to.be.revertedWith(
        nxErrors.ownerForbidden
      );
    });
  });

  describe("disapproveOperator", function () {
    it("should approve the account", async function () {
      const { token1, owner, alice } = await loadFixture(fixture);

      await token1.connect(owner).approveOperator(await alice.getAddress());

      await token1.connect(owner).disapproveOperator(await alice.getAddress());

      expect(await token1.isApprovedOperator(await alice.getAddress())).to.be.false;
    });

    it("should emit correct event", async function () {
      const { token1, owner, alice } = await loadFixture(fixture);

      await token1.connect(owner).approveOperator(await alice.getAddress());

      await expect(token1.connect(owner).disapproveOperator(await alice.getAddress()))
        .to.emit(token1, "OperatorDisapproved")
        .withArgs(await alice.getAddress());
    });

    it("should do nothing if already approved", async function () {
      const { token1, owner, alice } = await loadFixture(fixture);

      await expect(
        token1.connect(owner).disapproveOperator(await alice.getAddress()),
        "disapproveOperator transaction"
      ).not.to.emit(token1, "OperatorDisapproved");

      expect(await token1.isApprovedOperator(await alice.getAddress()), "isApprovedOperator after disapproveOperator")
        .to.be.false;
    });

    it("should be reverted when not called by owner", async function () {
      const { token1, alice } = await loadFixture(fixture);

      await expect(token1.connect(alice).disapproveOperator(await alice.getAddress())).to.be.revertedWith(
        nxErrors.ownerForbidden
      );
    });
  });
});
