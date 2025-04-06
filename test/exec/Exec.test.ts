import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import nxErrors from "../lib/nx-errors";

describe("Exec", function () {
  async function fixture() {
    const [alice, bob] = await ethers.getSigners();

    const Exec = await ethers.getContractFactory("Exec");
    const MockExec = await ethers.getContractFactory("MockExec");
    const MockCallee = await ethers.getContractFactory("MockCallee");
    const MockReverter = await ethers.getContractFactory("MockReverter");

    const [exec, mockExec, callee, reverter] = await Promise.all([
      Exec.deploy(),
      MockExec.deploy(),
      MockCallee.deploy(),
      MockReverter.deploy(),
    ]);

    return { alice, bob, exec, mockExec, callee, reverter };
  }

  before(async function () {
    await loadFixture(fixture);
  });

  describe("exec", function () {
    it("should receive value", async function () {
      const { alice, exec } = await loadFixture(fixture);

      const deposit = 3434n;

      await expect(exec.connect(alice).exec(await alice.getAddress(), "0x", 0n, { value: deposit }), "exec transaction")
        .not.to.be.reverted;

      expect((await ethers.provider.getBalance(exec.address)).toBigInt(), "exec received").to.eq(deposit);
    });

    it("should transfer value", async function () {
      const { alice, bob, exec } = await loadFixture(fixture);

      const deposit = 6666n;
      const amount = 1667n;
      const bobBalanceBefore = (await bob.getBalance()).toBigInt();

      await exec.connect(alice).exec(await bob.getAddress(), "0x", amount, { value: deposit });

      expect((await bob.getBalance()).toBigInt() - bobBalanceBefore, "bob received").to.eq(amount);
      expect((await ethers.provider.getBalance(exec.address)).toBigInt(), "exec remaining").to.eq(deposit - amount);
    });

    it("should call with data", async function () {
      const { alice, exec, callee } = await loadFixture(fixture);

      const data = "0xabcd";
      const amount = 1n;

      await expect(exec.connect(alice).exec(callee.address, data, amount, { value: amount }), "exec transaction")
        .to.emit(callee, "MockCalled")
        .withArgs(data, amount);
    });

    it("should call hooks", async function () {
      const { alice, mockExec, callee } = await loadFixture(fixture);

      const data = "0xefcdab";
      const amount = 234n;

      const txPromise = mockExec.connect(alice).exec(callee.address, data, amount, { value: amount });
      const tx = await txPromise;
      const receipt = await tx.wait();

      // prettier-ignore
      await expect(txPromise, "exec transaction")
        .to.emit(mockExec, "MockBeforeExecCalled")
        .to.emit(mockExec, "MockBeforeEachExecCalled").withArgs(callee.address, data, amount)
        .to.emit(callee, "MockCalled")                .withArgs(data, amount)
        .to.emit(mockExec, "MockAfterEachExecCalled") .withArgs(callee.address, data, amount)
        .to.emit(mockExec, "MockAfterExecCalled");

      const interfaces = [mockExec, callee].map((contract) => contract.interface);
      const eventName = (log: { topics: string[]; data: string }) => {
        for (let i = 0; i < interfaces.length; i++) {
          try {
            return interfaces[i].parseLog(log).name;
          } catch (e) {}
        }
        return undefined;
      };

      expect(receipt.logs.map(eventName), "event order").to.deep.eq([
        "MockBeforeExecCalled",
        "MockBeforeEachExecCalled",
        "MockCalled",
        "MockAfterEachExecCalled",
        "MockAfterExecCalled",
      ]);
    });

    it("should propagate revert data", async function () {
      const { alice, exec, reverter } = await loadFixture(fixture);

      await expect(
        exec.connect(alice).exec(reverter.address, reverter.interface.encodeFunctionData("revertYay"), 0n),
        "exec revertYay transaction"
      ).to.be.revertedWith("Yay");

      await expect(
        exec.connect(alice).exec(reverter.address, reverter.interface.encodeFunctionData("panicOutOfBound"), 0n),
        "exec panicOutOfBound transaction"
      ).to.be.revertedWithPanic(0x32);
    });

    it("should replace empty revert data", async function () {
      const { alice, exec, reverter } = await loadFixture(fixture);

      await expect(
        exec.connect(alice).exec(reverter.address, reverter.interface.encodeFunctionData("revertWithoutReason"), 0n),
        "exec revertWithoutReason transaction"
      ).to.be.revertedWith(nxErrors.Exec.noReason);
    });
  });

  describe("batchExec", function () {
    it("should receive value", async function () {
      const { alice, exec } = await loadFixture(fixture);

      const deposit = 3434n;

      await expect(exec.connect(alice).batchExec([], { value: deposit }), "batchExec transaction").not.to.be.reverted;

      expect((await ethers.provider.getBalance(exec.address)).toBigInt(), "exec received").to.eq(deposit);
    });

    it("should transfer value and call with data", async function () {
      const { alice, bob, exec, callee } = await loadFixture(fixture);

      const deposit = 4477n;
      const batch = [
        {
          to: await bob.getAddress(),
          data: "0x",
          value: 199n,
        },
        {
          to: callee.address,
          data: "0xeeffaa34",
          value: 34n,
        },
      ];
      const bobBalanceBefore = (await bob.getBalance()).toBigInt();

      await expect(exec.connect(alice).batchExec(batch, { value: deposit }), "batchExec transaction")
        .to.emit(callee, "MockCalled")
        .withArgs(batch[1].data, batch[1].value);

      expect((await bob.getBalance()).toBigInt() - bobBalanceBefore, "bob received").to.eq(batch[0].value);
    });

    it("should call hooks", async function () {
      const { alice, mockExec, callee } = await loadFixture(fixture);

      const batch = [
        {
          to: callee.address,
          data: "0x1234",
          value: 11n,
        },
        {
          to: callee.address,
          data: "0xeeffaa34",
          value: 22n,
        },
      ];

      const txPromise = mockExec.connect(alice).batchExec(batch, { value: 9999n });
      const tx = await txPromise;
      const receipt = await tx.wait();

      // prettier-ignore
      await expect(txPromise, "batchExec transaction")
        .to.emit(mockExec, "MockBeforeExecCalled")
        .to.emit(mockExec, "MockBeforeEachExecCalled").withArgs(callee.address, batch[0].data, batch[0].value)
        .to.emit(callee, "MockCalled")                .withArgs(batch[0].data, batch[0].value)
        .to.emit(mockExec, "MockAfterEachExecCalled") .withArgs(callee.address, batch[0].data, batch[0].value)
        .to.emit(mockExec, "MockBeforeEachExecCalled").withArgs(callee.address, batch[1].data, batch[1].value)
        .to.emit(callee, "MockCalled")                .withArgs(batch[1].data, batch[1].value)
        .to.emit(mockExec, "MockAfterEachExecCalled") .withArgs(callee.address, batch[1].data, batch[1].value)
        .to.emit(mockExec, "MockAfterExecCalled");

      const interfaces = [mockExec, callee].map((contract) => contract.interface);
      const eventName = (log: { topics: string[]; data: string }) => {
        for (let i = 0; i < interfaces.length; i++) {
          try {
            return interfaces[i].parseLog(log).name;
          } catch (e) {}
        }
        return undefined;
      };

      expect(receipt.logs.map(eventName), "event order").to.deep.eq([
        "MockBeforeExecCalled",
        "MockBeforeEachExecCalled",
        "MockCalled",
        "MockAfterEachExecCalled",
        "MockBeforeEachExecCalled",
        "MockCalled",
        "MockAfterEachExecCalled",
        "MockAfterExecCalled",
      ]);
    });

    it("should be reverted even if one call reverts", async function () {
      const { alice, bob, exec, reverter } = await loadFixture(fixture);

      const batch = [
        {
          to: await bob.getAddress(),
          data: "0x",
          value: 156n,
        },
        {
          to: reverter.address,
          data: reverter.interface.encodeFunctionData("revertYay"),
          value: 0n,
        },
      ];
      const bobBalanceBefore = (await bob.getBalance()).toBigInt();

      await expect(exec.connect(alice).batchExec(batch, { value: 1414n }), "batchExec transaction").to.be.revertedWith(
        "Yay"
      );
      expect((await bob.getBalance()).toBigInt() - bobBalanceBefore, "bob received").to.eq(0n);
    });

    it("should propagate first revert data", async function () {
      const { alice, exec, reverter } = await loadFixture(fixture);

      const batch = [
        {
          to: reverter.address,
          data: reverter.interface.encodeFunctionData("panicOutOfBound"),
          value: 0n,
        },
        {
          to: reverter.address,
          data: reverter.interface.encodeFunctionData("revertYay"),
          value: 0n,
        },
      ];

      await expect(exec.connect(alice).batchExec(batch), "batchExec transaction").to.be.revertedWithPanic(0x32);
    });
  });
});
