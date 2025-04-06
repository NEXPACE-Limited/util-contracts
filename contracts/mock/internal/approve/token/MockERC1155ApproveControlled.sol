// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { ERC1155Pausable } from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import { NextOwnablePausable } from "../../../../access/NextOwnablePausable.sol";
import { ApproveControlled } from "../../../../approve/ApproveControlled.sol";
import { ApproveController } from "../../../../approve/ApproveController.sol";
import { ERC1155ApproveControlled } from "../../../../approve/token/ERC1155ApproveControlled.sol";

/*
many functions are not used in test codes, but the compilability is part of test
*/
contract MockERC1155ApproveControlled is
    Context,
    ERC1155("///MockERC1155ApproveControlled/{id}"),
    NextOwnablePausable,
    ERC1155Pausable,
    ERC1155ApproveControlled
{
    constructor(ApproveController controller_) ApproveControlled(controller_) {}

    function mint(address to, uint256 id, uint256 amount, bytes memory data) external whenExecutable {
        _mint(to, id, amount, data);
    }

    /* trivial overrides */

    function isApprovedForAll(
        address owner_,
        address operator
    ) public view override(ERC1155, ERC1155ApproveControlled) returns (bool) {
        return ERC1155ApproveControlled.isApprovedForAll(owner_, operator);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Pausable) {
        ERC1155Pausable._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual override(ERC1155, ERC1155ApproveControlled) {
        ERC1155ApproveControlled._setApprovalForAll(owner, operator, approved);
    }
}
