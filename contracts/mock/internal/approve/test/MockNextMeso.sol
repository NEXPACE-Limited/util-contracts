// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { ERC2771Context } from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import { ERC20Pausable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import { ERC20ApproveControlled } from "../../../../approve/token/ERC20ApproveControlled.sol";
import { ApproveController } from "../../../../approve/ApproveController.sol";
import { NextOwnablePausable } from "../../../../access/NextOwnablePausable.sol";
import { ApproveControlled } from "../MockApproveControlled.sol";

contract MockNextMeso is
    ERC2771Context,
    ERC20("NextMeso", "NESO"),
    NextOwnablePausable,
    ERC20Burnable,
    ERC20Pausable,
    ERC20ApproveControlled
{
    constructor(
        address trustedForwarder,
        ApproveController controller_
    ) ERC2771Context(trustedForwarder) ApproveControlled(controller_) {}

    function mint(address to, uint256 amount) public whenExecutable {
        _mint(to, amount);
    }

    /* trivial overrides */

    function allowance(
        address owner_,
        address spender
    ) public view override(ERC20, ERC20ApproveControlled) returns (uint256) {
        return ERC20ApproveControlled.allowance(owner_, spender);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Pausable) {
        ERC20Pausable._beforeTokenTransfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal override(ERC20, ERC20ApproveControlled) {
        ERC20ApproveControlled._approve(owner, spender, amount);
    }

    function balanceOfBatch(address[] memory accounts) public view returns (uint256[] memory) {
        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i]);
        }

        return batchBalances;
    }

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
