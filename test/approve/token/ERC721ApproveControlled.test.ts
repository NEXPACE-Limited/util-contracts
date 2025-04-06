import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import nxErrors from "../../lib/nx-errors";

describe("ERC721ApproveControlled", function () {
  async function fixture() {
    const [owner, alice, bob, carol, user1, user2, nonUser1, nonUser2] = await ethers.getSigners();

    const [MockERC721ApproveControlled, ApproveController] = await Promise.all([
      ethers.getContractFactory("MockERC721ApproveControlled", owner),
      ethers.getContractFactory("ApproveController", owner),
    ]);

    const controller = await ApproveController.deploy(ethers.constants.AddressZero);
    const [token1, token2] = await Promise.all([
      MockERC721ApproveControlled.deploy(controller.address),
      MockERC721ApproveControlled.deploy(controller.address),
    ]);

    await Promise.all([
      controller.connect(user1).setApprove(true),
      controller.connect(user2).setApprove(true),
      token1.approveOperator(await alice.getAddress()),
      token1.approveOperator(await bob.getAddress()),
      token2.approveOperator(await bob.getAddress()),
      token2.grantExecutor(await carol.getAddress()),
      controller.setAllowlist(await alice.getAddress(), true),
      controller.setAllowlist(await bob.getAddress(), true),
      controller.setAllowlist(await nonUser1.getAddress(), true),
      controller.setAllowlist(await nonUser2.getAddress(), true),
      // mint 1001~1003 to user1, 2001~2003 to user2, ...
      // x002 is approved to alice, x003 is approved to bob
      ...[user1, user2, nonUser1, nonUser2].flatMap(async (signer, index) => [
        ...[token1, token2].flatMap((token) =>
          [...Array(3).keys()].map(async (i) => token.mint(await signer.getAddress(), (index + 1) * 1000 + i + 1))
        ),
        token2.connect(signer).approve(await alice.getAddress(), (index + 1) * 1000 + 2),
        token2.connect(signer).approve(await bob.getAddress(), (index + 1) * 1000 + 3),
      ]),
      token1.mint(await bob.getAddress(), 1),
      token2.connect(nonUser2).setApprovalForAll(await alice.getAddress(), true),
      token2.connect(nonUser2).setApprovalForAll(await bob.getAddress(), true),
      token2.connect(nonUser1).approve(await nonUser2.getAddress(), 3001),
      token2.connect(nonUser2).setApprovalForAll(await nonUser1.getAddress(), true),
    ]);

    const recipientAddress = "0x" + "11".repeat(20);

    return {
      controller,
      token1,
      token2,
      owner,
      alice,
      bob,
      carol,
      user1,
      user2,
      nonUser1,
      nonUser2,
      recipientAddress,
    };
  }

  before(async function () {
    await loadFixture(fixture);
  });

  describe("isApprovedForAll", function () {
    it("should return true if approved by controller", async function () {
      const { token1, alice, user1 } = await loadFixture(fixture);

      expect(await token1.isApprovedForAll(await user1.getAddress(), await alice.getAddress())).to.be.true;
    });

    it("should return false if neither approved by controller nor manually set", async function () {
      const { token1, nonUser1, nonUser2 } = await loadFixture(fixture);

      expect(await token1.isApprovedForAll(await nonUser1.getAddress(), await nonUser2.getAddress())).to.be.false;
    });

    it("should return true if not approved by controller but manually set", async function () {
      const { token2, nonUser1, nonUser2 } = await loadFixture(fixture);

      expect(await token2.isApprovedForAll(await nonUser2.getAddress(), await nonUser1.getAddress())).to.be.true;
    });

    it("should return false for non-approver", async function () {
      const { token1, alice, nonUser1 } = await loadFixture(fixture);

      expect(await token1.isApprovedForAll(await nonUser1.getAddress(), await alice.getAddress())).to.be.false;
    });

    it("should return false for non-operator", async function () {
      const { token1, user1, user2 } = await loadFixture(fixture);

      expect(await token1.isApprovedForAll(await user1.getAddress(), await user2.getAddress())).to.be.false;
    });
  });

  describe("transferFrom", function () {
    it("should not be reverted if approved by controller", async function () {
      const { token1, alice, user1, recipientAddress } = await loadFixture(fixture);

      await expect(token1.connect(alice).transferFrom(await user1.getAddress(), recipientAddress, 1001)).not.to.be
        .reverted;
    });

    it("should be reverted when operator tries to spend unapproved token", async function () {
      const { token2, alice, nonUser1, recipientAddress } = await loadFixture(fixture);

      await expect(
        token2.connect(alice).transferFrom(await nonUser1.getAddress(), recipientAddress, 3001)
      ).to.be.revertedWith(nxErrors.ERC721.transferForbidden);
    });

    it("should be reverted when non-operator tries to spend token approved by controller", async function () {
      const { token2, user1, user2, recipientAddress } = await loadFixture(fixture);

      await expect(
        token2.connect(user1).transferFrom(await user2.getAddress(), recipientAddress, 2001)
      ).to.be.revertedWith(nxErrors.ERC721.transferForbidden);
    });

    it("should not be reverted when spending manually approved token", async function () {
      const { token2, nonUser1, nonUser2, recipientAddress } = await loadFixture(fixture);

      await expect(token2.connect(nonUser2).transferFrom(await nonUser1.getAddress(), recipientAddress, 3001)).not.to.be
        .reverted;
    });

    it("should not be reverted when spending manually approved owner's token", async function () {
      const { token2, nonUser1, nonUser2, recipientAddress } = await loadFixture(fixture);

      await expect(token2.connect(nonUser1).transferFrom(await nonUser2.getAddress(), recipientAddress, 4001)).not.to.be
        .reverted;
    });

    it("should not be reverted when operator spends manually approved token", async function () {
      const { token2, bob, nonUser1, recipientAddress } = await loadFixture(fixture);

      await expect(token2.connect(bob).transferFrom(await nonUser1.getAddress(), recipientAddress, 3003)).not.to.be
        .reverted;
    });

    it("should not be reverted when operator spends manually approved owner's token", async function () {
      const { token2, bob, nonUser2, recipientAddress } = await loadFixture(fixture);

      await expect(token2.connect(bob).transferFrom(await nonUser2.getAddress(), recipientAddress, 4001)).not.to.be
        .reverted;
    });

    it("should not be reverted when operator spends its own token", async function () {
      const { token1, bob, recipientAddress } = await loadFixture(fixture);

      await expect(token1.connect(bob).transferFrom(await bob.getAddress(), recipientAddress, 1)).not.to.be.reverted;
    });

    it("should not be reverted when approver spends its own token", async function () {
      const { token1, user1, recipientAddress } = await loadFixture(fixture);

      await expect(token1.connect(user1).transferFrom(await user1.getAddress(), recipientAddress, 1001)).not.to.be
        .reverted;
    });

    it("should not be reverted when non-approver spends its own token", async function () {
      const { token1, nonUser1, recipientAddress } = await loadFixture(fixture);

      await expect(token1.connect(nonUser1).transferFrom(await nonUser1.getAddress(), recipientAddress, 3001)).not.to.be
        .reverted;
    });

    it("executor is not operator", async function () {
      const { token2, carol, user1, recipientAddress } = await loadFixture(fixture);

      await expect(
        token2.connect(carol).transferFrom(await user1.getAddress(), recipientAddress, 1001)
      ).to.be.revertedWith(nxErrors.ERC721.transferForbidden);
    });

    it("owner is not operator", async function () {
      const { token2, owner, user1, recipientAddress } = await loadFixture(fixture);

      await expect(
        token2.connect(owner).transferFrom(await user1.getAddress(), recipientAddress, 1001)
      ).to.be.revertedWith(nxErrors.ERC721.transferForbidden);
    });
  });

  describe("approve", function () {
    it("Success", async function () {
      const { controller, token1, alice, user1 } = await loadFixture(fixture);

      await controller.setAllowlist(await user1.getAddress(), true);
      await token1.mint(await alice.getAddress(), 5001);
      await token1.connect(alice).approve(await user1.getAddress(), 5001);
    });
    it("should revert when not allowlisted", async function () {
      const { token1, alice, user1 } = await loadFixture(fixture);

      await token1.mint(await alice.getAddress(), 5001);
      await expect(token1.connect(alice).approve(await user1.getAddress(), 5001)).to.be.revertedWith(
        nxErrors.notAllowlisted
      );
    });
  });

  describe("setApprovalForAll", function () {
    it("Success", async function () {
      const { controller, token1, alice, user1 } = await loadFixture(fixture);

      await controller.setAllowlist(await user1.getAddress(), true);
      await token1.connect(alice).setApprovalForAll(await user1.getAddress(), true);
    });
    it("should revert when not allowlisted", async function () {
      const { token1, alice, user1 } = await loadFixture(fixture);

      await expect(token1.connect(alice).setApprovalForAll(await user1.getAddress(), true)).to.be.revertedWith(
        nxErrors.notAllowlisted
      );
    });
  });
});
