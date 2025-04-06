// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Pausable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import { NextOwnablePausable } from "../../../../access/NextOwnablePausable.sol";
import { ApproveControlled } from "../../../../approve/ApproveControlled.sol";
import { ApproveController } from "../../../../approve/ApproveController.sol";
import { ERC20ApproveControlled } from "../../../../approve/token/ERC20ApproveControlled.sol";

/*
many functions are not used in test codes, but the compilability is part of test
*/
contract MockERC20ApproveControlled is
    Context,
    ERC20("MockERC20ApproveControlled", "MockERC20ApproveControlled"),
    NextOwnablePausable,
    ERC20Pausable,
    ERC20ApproveControlled
{
    constructor(ApproveController controller_) ApproveControlled(controller_) {}

    function mint(address account, uint256 amount) external whenExecutable {
        _mint(account, amount);
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
}
