import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import nxErrors from "../../lib/nx-errors";

describe("ERC20ApproveControlled", function () {
  const UINT256_MAX = (1n << 256n) - 1n;

  async function fixture() {
    const [owner, alice, bob, carol, user1, user2, nonUser1, nonUser2] = await ethers.getSigners();

    const [MockERC20ApproveControlled, ApproveController] = await Promise.all([
      ethers.getContractFactory("MockERC20ApproveControlled", owner),
      ethers.getContractFactory("ApproveController", owner),
    ]);

    const controller = await ApproveController.deploy(ethers.constants.AddressZero);
    const [token1, token2] = await Promise.all([
      MockERC20ApproveControlled.deploy(controller.address),
      MockERC20ApproveControlled.deploy(controller.address),
    ]);

    const signers: Record<string, Signer> = {
      alice,
      bob,
      user1,
      user2,
      nonUser1,
      nonUser2,
    };

    const allowances = {
      user2: {
        alice: 500n,
        bob: 1000n,
        nonUser2: UINT256_MAX,
      },
      nonUser1: {
        nonUser2: 1555n,
      },
      nonUser2: {
        alice: UINT256_MAX,
        bob: 5000n,
        nonUser1: UINT256_MAX,
      },
    };

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
      ...Object.entries(allowances).flatMap(([from, toMap]) =>
        Object.entries(toMap).map(async ([to, amount]) =>
          token2.connect(signers[from]).approve(await signers[to].getAddress(), amount)
        )
      ),
      ...[token1, token2].flatMap((token) =>
        [alice, bob, user1, user2, nonUser1, nonUser2].map(async (signer) =>
          token.mint(await signer.getAddress(), 10000n)
        )
      ),
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
      allowances,
      recipientAddress,
    };
  }

  before(async function () {
    await loadFixture(fixture);
  });

  describe("allowance", function () {
    it("should return max if approved by controller", async function () {
      const { token1, alice, user1 } = await loadFixture(fixture);

      expect(await token1.allowance(await user1.getAddress(), await alice.getAddress())).to.eq(UINT256_MAX);
    });

    it("should return normal allowance value for non-approver", async function () {
      const { token1, alice, nonUser1 } = await loadFixture(fixture);

      expect(await token1.allowance(await nonUser1.getAddress(), await alice.getAddress())).to.eq(0n);
    });

    it("should return normal allowance value for non-operator", async function () {
      const { token2, alice, user1 } = await loadFixture(fixture);

      expect(await token2.allowance(await user1.getAddress(), await alice.getAddress())).to.eq(0n);
    });

    it("should return the approved amount if the non-approver has manually approved", async function () {
      const { token2, bob, nonUser2, allowances } = await loadFixture(fixture);

      expect(await token2.allowance(await nonUser2.getAddress(), await bob.getAddress())).to.eq(
        allowances.nonUser2.bob
      );
    });

    it("should return the approved amount if the approver has additionally approved to the non-operator", async function () {
      const { token2, alice, user2, allowances } = await loadFixture(fixture);

      expect(await token2.allowance(await user2.getAddress(), await alice.getAddress())).to.eq(allowances.user2.alice);
    });

    it("should return approved amount between non-operators", async function () {
      const { token2, nonUser1, nonUser2, allowances } = await loadFixture(fixture);

      expect(await token2.allowance(await nonUser1.getAddress(), await nonUser2.getAddress())).to.eq(
        allowances.nonUser1.nonUser2
      );
    });

    it("should revert when not allowlisted", async function () {
      const { token1, alice, user1 } = await loadFixture(fixture);

      await expect(token1.connect(alice).approve(await user1.getAddress(), 100n)).to.be.revertedWith(
        nxErrors.notAllowlisted
      );
    });
  });

  describe("transferFrom", function () {
    it("should not be reverted if approved by controller", async function () {
      const { token1, alice, user1, recipientAddress } = await loadFixture(fixture);

      await expect(token1.connect(alice).transferFrom(await user1.getAddress(), recipientAddress, 1n)).not.to.be
        .reverted;
    });

    it("should not consume allowance if approved by controller", async function () {
      const { controller, token2, bob, user2, recipientAddress, allowances } = await loadFixture(fixture);

      await token2.connect(bob).transferFrom(await user2.getAddress(), recipientAddress, 1n);
      await controller.connect(user2).setApprove(false);

      expect(await token2.allowance(await user2.getAddress(), await bob.getAddress())).to.eq(allowances.user2.bob);
    });

    it("should consume allowance if not approved by controller", async function () {
      const { token2, nonUser1, nonUser2, recipientAddress, allowances } = await loadFixture(fixture);

      await token2.connect(nonUser2).transferFrom(await nonUser1.getAddress(), recipientAddress, 1n);

      expect(await token2.allowance(await nonUser1.getAddress(), await nonUser2.getAddress())).to.eq(
        allowances.nonUser1.nonUser2 - 1n
      );
    });

    it("should be reverted when operator tries to spend unapproved token", async function () {
      const { token1, alice, nonUser1, recipientAddress } = await loadFixture(fixture);

      await expect(
        token1.connect(alice).transferFrom(await nonUser1.getAddress(), recipientAddress, 1n)
      ).to.be.revertedWith(nxErrors.ERC20.transferForbidden);
    });

    it("should be reverted when non-operator tries to spend token approved by controller", async function () {
      const { token1, user1, user2, recipientAddress } = await loadFixture(fixture);

      await expect(
        token1.connect(user1).transferFrom(await user2.getAddress(), recipientAddress, 1n)
      ).to.be.revertedWith(nxErrors.ERC20.transferForbidden);
    });

    it("should not be reverted when spending manually approved token", async function () {
      const { token2, nonUser1, nonUser2, recipientAddress } = await loadFixture(fixture);

      await expect(token2.connect(nonUser1).transferFrom(await nonUser2.getAddress(), recipientAddress, 1n)).not.to.be
        .reverted;
    });

    it("should not be reverted when operator spends manually approved token", async function () {
      const { token2, alice, nonUser2, recipientAddress } = await loadFixture(fixture);

      await expect(token2.connect(alice).transferFrom(await nonUser2.getAddress(), recipientAddress, 1n)).not.to.be
        .reverted;
    });

    it("should not be reverted when non-operator spends token approved by controller and manually at the same time", async function () {
      const { token2, user2, nonUser2, recipientAddress } = await loadFixture(fixture);

      await expect(token2.connect(nonUser2).transferFrom(await user2.getAddress(), recipientAddress, 1n)).not.to.be
        .reverted;
    });

    it("executor is not operator", async function () {
      const { token2, carol, user1, recipientAddress } = await loadFixture(fixture);

      await expect(
        token2.connect(carol).transferFrom(await user1.getAddress(), recipientAddress, 1n)
      ).to.be.revertedWith(nxErrors.ERC20.transferForbidden);
    });

    it("owner is not operator", async function () {
      const { token2, owner, user1, recipientAddress } = await loadFixture(fixture);

      await expect(
        token2.connect(owner).transferFrom(await user1.getAddress(), recipientAddress, 1n)
      ).to.be.revertedWith(nxErrors.ERC20.transferForbidden);
    });
  });

  describe("transfer", function () {
    it("should not be reverted when operator spends its own token", async function () {
      const { token1, alice, recipientAddress } = await loadFixture(fixture);

      await expect(token1.connect(alice).transfer(recipientAddress, 1n)).not.to.be.reverted;
    });

    it("should not be reverted when approver spends its own token", async function () {
      const { token1, user1, recipientAddress } = await loadFixture(fixture);

      await expect(token1.connect(user1).transfer(recipientAddress, 1n)).not.to.be.reverted;
    });

    it("should not be reverted when non-approver spends its own token", async function () {
      const { token1, nonUser1, recipientAddress } = await loadFixture(fixture);

      await expect(token1.connect(nonUser1).transfer(recipientAddress, 1n)).not.to.be.reverted;
    });
  });
});
