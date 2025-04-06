// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { ERC2771Context } from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import { NextOwnablePausable } from "../access/NextOwnablePausable.sol";

/// @notice Registry contract that keeps approved user addresses. In addition, keeps the allowlisted contract addresses.
contract ApproveController is ERC2771Context, NextOwnablePausable {
    struct Approval {
        bool approved;
        uint256 approveDate;
    }

    mapping(address => Approval) private _approvals;

    mapping(address => bool) private _allowlisted;

    event SetApprove(address indexed account, bool newApproved);
    event SetAllowlisted(address indexed account, bool newAllowed);

    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    /// @notice Sets the approval of the caller. Users will call this function to approve all their assets.
    function setApprove(bool newApproved) public whenNotPaused {
        _approvals[_msgSender()] = Approval(newApproved, block.timestamp);

        emit SetApprove(_msgSender(), newApproved);
    }

    /// @notice Sets whether the given contract is allowlisted.
    /// Users can directly approve their assets to only the allowlisted contracts. Only owner can call.
    /// Allowlist has nothing to do with setApprove.
    function setAllowlist(address account, bool newAllowed) public onlyOwner {
        _allowlisted[account] = newAllowed;

        emit SetAllowlisted(account, newAllowed);
    }

    /// @notice Returns whether the given address has approved.
    function isApproved(address account) public view returns (bool) {
        return _approvals[account].approved;
    }

    /// @notice Returns the timestamp when the given address approved.
    function getApproveDate(address account) public view returns (uint256) {
        return _approvals[account].approveDate;
    }

    /// @notice Returns whether the given contract address is allowlisted.
    function isAllowlisted(address account) public view returns (bool) {
        return _allowlisted[account];
    }

    /* trivial overrides */

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
