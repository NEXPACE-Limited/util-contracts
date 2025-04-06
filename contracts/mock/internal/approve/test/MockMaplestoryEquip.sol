// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { ERC2771Context } from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721Pausable } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import { ERC721ApproveControlled } from "../../../../approve/token/ERC721ApproveControlled.sol";
import { ApproveController } from "../../../../approve/ApproveController.sol";
import { NextOwnablePausable } from "../../../../access/NextOwnablePausable.sol";
import { ApproveControlled } from "../MockApproveControlled.sol";

contract MockMaplestoryEquip is
    ERC2771Context,
    ERC721("MaplestoryEquip", "MSE"),
    NextOwnablePausable,
    ERC721Pausable,
    ERC721ApproveControlled
{
    using Strings for uint256;

    struct Token {
        uint256 itemId;
        uint256 number;
    }

    struct Item {
        uint256 totalSupply;
        uint256 limitSupply;
        uint256 currentSupply;
    }

    struct Mint {
        uint256 itemId;
        uint256 tokenId;
    }

    string private _defaultURI;
    uint256 private _totalSupply;

    // solhint-disable-next-line var-name-mixedcase
    mapping(uint256 => string) private _URIs;
    mapping(uint256 => Token) private _tokens;
    mapping(uint256 => Item) private _items;

    event ItemLimitSupply(uint256 indexed itemId, uint256 indexed previousLimitSupply, uint256 indexed newLimitSupply);
    event ItemCreated(uint256 indexed tokenId, uint256 indexed itemId, uint256 indexed number);

    constructor(
        address trustedForwarder,
        ApproveController controller_,
        string memory defaultURI
    ) ERC2771Context(trustedForwarder) ApproveControlled(controller_) {
        _defaultURI = defaultURI;
    }

    function setDefaultURI(string memory newURI) external whenExecutable {
        _defaultURI = newURI;
    }

    function setItemURI(uint256 itemId, string memory newURI) external whenExecutable {
        _URIs[itemId] = newURI;
    }

    function getTokenItemId(uint256 tokenId) external view returns (uint256) {
        return _tokens[tokenId].itemId;
    }

    function getTokenNumber(uint256 tokenId) external view returns (uint256) {
        return _tokens[tokenId].number;
    }

    function getItemTotalSupply(uint256 itemId) external view returns (uint256) {
        return _items[itemId].totalSupply;
    }

    function getItemLimitSupply(uint256 itemId) external view returns (uint256) {
        return _items[itemId].limitSupply;
    }

    function getItemCurrentSupply(uint256 itemId) external view returns (uint256) {
        return _items[itemId].currentSupply;
    }

    function setLimitSupply(uint256 itemId, uint256 newLimitSupply) external onlyOwner {
        Item storage item = _items[itemId];
        require(
            newLimitSupply == 0 || item.totalSupply <= newLimitSupply,
            "MaplestoryEquip-001: Item supplies already exceeded new limit"
        );

        emit ItemLimitSupply(itemId, item.limitSupply, newLimitSupply);

        item.limitSupply = newLimitSupply;
    }

    function mint(address to, uint256 itemId, uint256 tokenId) public whenExecutable {
        Item storage item = _items[itemId];

        require(
            item.limitSupply == 0 || item.totalSupply < item.limitSupply,
            "MaplestoryEquip-002: Can't mint more than max supplies"
        );
        require(!_exists(tokenId), "MaplestoryEquip-003: Minting tokenId already exists");

        ERC721._mint(to, tokenId);

        unchecked {
            item.totalSupply++;
            item.currentSupply++;
        }
        _tokens[tokenId] = Token(itemId, item.totalSupply);
        _totalSupply++;

        emit ItemCreated(tokenId, itemId, item.totalSupply);
    }

    function mintBatch(address to, Mint[] memory mints) external whenExecutable {
        for (uint256 i = 0; i < mints.length; ) {
            mint(to, mints[i].itemId, mints[i].tokenId);
            unchecked {
                i++;
            }
        }
    }

    function burn(uint256 tokenId) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId) || _msgSender() == owner(),
            "MaplestoryEquip-004: Caller is not owner nor approved"
        );

        Token storage token = _tokens[tokenId];
        _items[token.itemId].currentSupply--;
        delete _tokens[tokenId];

        _burn(tokenId);
    }

    function burnBatch(uint256[] memory tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; ) {
            burn(tokenIds[i]);
            unchecked {
                i++;
            }
        }
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "MaplestoryEquip-005: URI query for nonexistent token");

        uint256 itemId = _tokens[tokenId].itemId;
        string memory uri = bytes(_URIs[itemId]).length > 0 ? _URIs[itemId] : _defaultURI;

        return string(abi.encodePacked(uri, tokenId.toString(), ".json"));
    }

    function ownerOfBatch(uint256[] memory tokenIds) public view returns (address[] memory) {
        address[] memory batchOwners = new address[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; ++i) {
            batchOwners[i] = ownerOf(tokenIds[i]);
        }

        return batchOwners;
    }

    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) {
            // nx-errors-ignore
            revert(string(abi.encodePacked("MaplestoryEquip-006: invalid token ID(", tokenId.toString(), ")")));
        }
        return owner;
    }

    function _burn(uint256 tokenId) internal override(ERC721) {
        ERC721._burn(tokenId);
        _totalSupply--;
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

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
