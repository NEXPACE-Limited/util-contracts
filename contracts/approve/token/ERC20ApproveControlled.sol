// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ApproveControlled } from "../ApproveControlled.sol";

abstract contract ERC20ApproveControlled is ERC20, ApproveControlled {
    /// @notice Overrides allowance function to return infinite allowance when the transfer is approved by
    /// ApproveController.
    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        if (isApprovedOperator(spender) && _isApprover(owner)) return type(uint256).max;
        return ERC20.allowance(owner, spender);
    }

    /// @notice Restricts the spender to be allowlisted. Users cannot modify their allowance to non-allowlisted spender.
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual override onlyAllowlisted(spender) {
        ERC20._approve(owner, spender, amount);
    }
}
