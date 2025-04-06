// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { ERC2771Context } from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { ERC1155Pausable } from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import { ERC1155ApproveControlled } from "../../../../approve/token/ERC1155ApproveControlled.sol";
import { ApproveController } from "../../../../approve/ApproveController.sol";
import { NextOwnablePausable } from "../../../../access/NextOwnablePausable.sol";
import { ApproveControlled } from "../MockApproveControlled.sol";

contract MockMaplestoryUsable is
    ERC2771Context,
    ERC1155(""),
    NextOwnablePausable,
    ERC1155Pausable,
    ERC1155ApproveControlled
{
    using Strings for uint256;

    mapping(uint256 => uint256) private _totalSupply;
    mapping(uint256 => uint256) private _currentSupply;
    mapping(uint256 => string) private _tokenURI;

    constructor(
        address trustedForwarder,
        ApproveController controller_
    ) ERC2771Context(trustedForwarder) ApproveControlled(controller_) {}

    function setURI(string memory newuri) public whenExecutable {
        _setURI(newuri);
    }

    function setTokenURI(string memory newuri, uint256 id) public whenExecutable {
        _tokenURI[id] = newuri;
    }

    function mint(address to, uint256 id, uint256 amount, bytes memory data) public whenExecutable {
        _mint(to, id, amount, data);

        _totalSupply[id] += amount;
        _currentSupply[id] += amount;
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public whenExecutable {
        _mintBatch(to, ids, amounts, data);

        for (uint256 i = 0; i < ids.length; ) {
            _totalSupply[ids[i]] += amounts[i];
            _currentSupply[ids[i]] += amounts[i];
            unchecked {
                i++;
            }
        }
    }

    function burn(address from, uint256 id, uint256 amount) public {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()) || _msgSender() == owner(),
            "MaplestoryUsable-001: Caller is not owner nor approved"
        );

        _burn(from, id, amount);

        unchecked {
            _currentSupply[id] -= amount;
        }
    }

    function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts) public {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()) || _msgSender() == owner(),
            "MaplestoryUsable-001: Caller is not owner nor approved"
        );

        _burnBatch(from, ids, amounts);

        for (uint256 i = 0; i < ids.length; ) {
            unchecked {
                _currentSupply[ids[i]] -= amounts[i];
                i++;
            }
        }
    }

    function uri(uint256 id) public view override returns (string memory) {
        require(_totalSupply[id] > 0, "MaplestoryUsable-002: Existing token only get uri");

        return
            bytes(_tokenURI[id]).length > 0
                ? _tokenURI[id]
                : string(abi.encodePacked(ERC1155.uri(id), id.toString(), ".json"));
    }

    function totalSupply(uint256 id) public view returns (uint256 amount) {
        amount = _totalSupply[id];
    }

    function currentSupply(uint256 id) public view returns (uint256 amount) {
        amount = _currentSupply[id];
    }

    /* trivial overrides */

    function isApprovedForAll(
        address account,
        address operator
    ) public view override(ERC1155, ERC1155ApproveControlled) returns (bool) {
        return ERC1155ApproveControlled.isApprovedForAll(account, operator);
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

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
