import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const empty = "0x";

describe("ApproveController", function () {
  async function fixture() {
    const [operator, executor, ad1, ad2] = await ethers.getSigners();

    const [Controller, Usable, Equip, Neso] = await Promise.all([
      ethers.getContractFactory("MockApproveController"),
      ethers.getContractFactory("MockMaplestoryUsable"),
      ethers.getContractFactory("MockMaplestoryEquip"),
      ethers.getContractFactory("MockNextMeso"),
    ]);
    const defaultURI = "https://defaultURI.com/";

    const controller = await Controller.deploy(ethers.constants.AddressZero);
    const usable = await Usable.deploy(ethers.constants.AddressZero, controller.address);
    const equip = await Equip.deploy(ethers.constants.AddressZero, controller.address, defaultURI);
    const neso = await Neso.deploy(ethers.constants.AddressZero, controller.address);

    await controller.deployed();
    await usable.deployed();
    await equip.deployed();
    await neso.deployed();

    await usable.grantExecutor(await executor.getAddress());
    await equip.grantExecutor(await executor.getAddress());
    await neso.grantExecutor(await executor.getAddress());
    await controller.connect(ad1).setApprove(true);
    await equip.connect(executor).mint(await ad1.getAddress(), 1, 1);
    await usable.connect(executor).mint(await ad1.getAddress(), 1, 1000, empty);
    await neso.connect(executor).mint(await ad1.getAddress(), 10000);

    await equip.approveOperator(await operator.getAddress());
    await usable.approveOperator(await operator.getAddress());
    await neso.approveOperator(await operator.getAddress());

    return {
      controller,
      equip,
      usable,
      neso,
      executor,
      operator,
      ad1,
      ad2,
    };
  }
  // preload fixture
  before(async function () {
    await loadFixture(fixture);
  });

  describe("Approve Test", function () {
    it("Operator can transfer user's token when approved", async function () {
      const { equip, usable, neso, operator, ad1, ad2 } = await loadFixture(fixture);
      await equip.connect(operator).transferFrom(await ad1.getAddress(), await ad2.getAddress(), 1);

      await usable.connect(operator).safeTransferFrom(await ad1.getAddress(), await ad2.getAddress(), 1, 123, empty);

      await usable.connect(operator).safeTransferFrom(await ad1.getAddress(), await ad2.getAddress(), 1, 877, empty);

      await neso.connect(operator).transferFrom(await ad1.getAddress(), await ad2.getAddress(), 10000);
    });

    it("Creator can't transfer user's token when approval unset", async function () {
      const { controller, equip, operator, ad1, ad2 } = await loadFixture(fixture);

      await controller.connect(ad1).setApprove(false);

      await expect(equip.connect(operator).transferFrom(await ad1.getAddress(), await ad2.getAddress(), 1)).to.be
        .reverted;

      await controller.connect(ad1).setApprove(true);

      await equip.connect(operator).transferFrom(await ad1.getAddress(), await ad2.getAddress(), 1);
    });
  });

  describe("For coverage", function () {
    it("getApproveDate", async function () {
      const { controller, ad2 } = await loadFixture(fixture);

      expect(await controller.getApproveDate(await ad2.getAddress())).to.be.equal(0);
    });
    it("getMSgData", async function () {
      const { controller } = await loadFixture(fixture);

      await controller.getMsgData();
    });
    it("negative cases", async function () {
      const { controller, ad1, ad2 } = await loadFixture(fixture);

      await expect(controller.pause()).not.to.be.reverted;
      await expect(controller.connect(ad1).setApprove(false)).to.be.reverted;
      await expect(controller.unpause()).not.to.be.reverted;

      await expect(controller.connect(ad1).setAllowlist(await ad2.getAddress(), true)).to.be.reverted;
    });
  });
});
