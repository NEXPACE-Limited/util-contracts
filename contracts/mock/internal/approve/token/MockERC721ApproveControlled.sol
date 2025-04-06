// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Pausable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import { NextOwnablePausable } from "../../../../access/NextOwnablePausable.sol";
import { ApproveControlled } from "../../../../approve/ApproveControlled.sol";
import { ApproveController } from "../../../../approve/ApproveController.sol";
import { ERC721ApproveControlled } from "../../../../approve/token/ERC721ApproveControlled.sol";

/*
many functions are not used in test codes, but the compilability is part of test
*/
contract MockERC721ApproveControlled is
    Context,
    ERC721("MockERC721ApproveControlled", "MockERC721ApproveControlled"),
    NextOwnablePausable,
    ERC721Pausable,
    ERC721ApproveControlled
{
    constructor(ApproveController controller_) ApproveControlled(controller_) {}

    function mint(address account, uint256 tokenId) external whenExecutable {
        _mint(account, tokenId);
    }

    /* trivial overrides */

    function isApprovedForAll(
        address owner_,
        address operator
    ) public view override(ERC721, ERC721ApproveControlled) returns (bool) {
        return ERC721ApproveControlled.isApprovedForAll(owner_, operator);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Pausable) {
        ERC721Pausable._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _approve(address to, uint256 tokenId) internal virtual override(ERC721, ERC721ApproveControlled) {
        ERC721ApproveControlled._approve(to, tokenId);
    }

    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual override(ERC721, ERC721ApproveControlled) {
        ERC721ApproveControlled._setApprovalForAll(owner, operator, approved);
    }
}
