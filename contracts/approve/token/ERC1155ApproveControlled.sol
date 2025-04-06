// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { ApproveControlled } from "../ApproveControlled.sol";

abstract contract ERC1155ApproveControlled is ERC1155, ApproveControlled {
    /// @notice Overrides isApprovedForAll function to return true when the transfer is approved by ApproveController.
    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        if (isApprovedOperator(operator) && _isApprover(owner)) return true;
        return ERC1155.isApprovedForAll(owner, operator);
    }

    /// @notice Restricts the spender to be allowlisted. Users cannot modify approval to non-allowlisted spender.
    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual override onlyAllowlisted(operator) {
        ERC1155._setApprovalForAll(owner, operator, approved);
    }
}
