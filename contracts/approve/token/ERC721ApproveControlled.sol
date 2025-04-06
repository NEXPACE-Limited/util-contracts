// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ApproveControlled } from "../ApproveControlled.sol";

abstract contract ERC721ApproveControlled is ERC721, ApproveControlled {
    /// @notice Overrides isApprovedForAll function to return true when the transfer is approved by ApproveController.
    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        if (isApprovedOperator(operator) && _isApprover(owner)) return true;
        return ERC721.isApprovedForAll(owner, operator);
    }

    /// @notice Restricts the spender to be allowlisted. Users cannot modify approval to non-allowlisted spender.
    function _approve(address to, uint256 tokenId) internal virtual override onlyAllowlisted(to) {
        ERC721._approve(to, tokenId);
    }

    /// @notice Restricts the spender to be allowlisted. Users cannot modify approval to non-allowlisted spender.
    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual override onlyAllowlisted(operator) {
        ERC721._setApprovalForAll(owner, operator, approved);
    }
}
