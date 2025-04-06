import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("MockCallee", function () {
  async function fixture() {
    const [signer] = await ethers.getSigners();

    const MockCallee = await ethers.getContractFactory("MockCallee", signer);

    const callee = await MockCallee.deploy();

    return { signer, callee };
  }

  before(async function () {
    await loadFixture(fixture);
  });

  describe("receive/fallback", function () {
    it("should emit correct event when called with nothing", async function () {
      const { signer, callee } = await loadFixture(fixture);

      await expect(signer.sendTransaction({ to: callee.address }))
        .to.emit(callee, "MockCalled")
        .withArgs("0x", 0n);
    });

    it("should emit correct event when called with data", async function () {
      const { signer, callee } = await loadFixture(fixture);

      await expect(signer.sendTransaction({ to: callee.address, data: "0xbbcc" }))
        .to.emit(callee, "MockCalled")
        .withArgs("0xbbcc", 0n);
    });

    it("should emit correct event when called with value", async function () {
      const { signer, callee } = await loadFixture(fixture);

      await expect(signer.sendTransaction({ to: callee.address, value: 55n }))
        .to.emit(callee, "MockCalled")
        .withArgs("0x", 55n);
    });

    it("should emit correct event when called with data and value", async function () {
      const { signer, callee } = await loadFixture(fixture);

      await expect(signer.sendTransaction({ to: callee.address, data: "0xbbcc", value: 66n }))
        .to.emit(callee, "MockCalled")
        .withArgs("0xbbcc", 66n);
    });
  });
});
