// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ApproveController } from "./ApproveController.sol";

/// @notice Base contract for approve controlled tokens.
contract ApproveControlled is Ownable {
    ApproveController public immutable controller;

    mapping(address => bool) private _isApprovedOperator;

    event OperatorApproved(address indexed operator);
    event OperatorDisapproved(address indexed operator);

    constructor(ApproveController controller_) {
        controller = controller_;
    }

    /// @notice Reverts when the given contract address is not allowlisted.
    modifier onlyAllowlisted(address account) {
        require(controller.isAllowlisted(account), "ApproveControlled/notAllowlisted: account is not allowlisted");
        _;
    }

    /// @notice Sets the given address as approved operator(spender) of tokens owned by users who approved their assets to
    /// ApproveController. Only owner can call.
    function approveOperator(address operator) external onlyOwner {
        if (isApprovedOperator(operator)) return;
        _isApprovedOperator[operator] = true;
        emit OperatorApproved(operator);
    }

    /// @notice Unsets the given address from approved operator.
    function disapproveOperator(address operator) external onlyOwner {
        if (!isApprovedOperator(operator)) return;
        _isApprovedOperator[operator] = false;
        emit OperatorDisapproved(operator);
    }

    /// @notice Returns whether the given address is approved operator.
    function isApprovedOperator(address account) public view returns (bool) {
        return _isApprovedOperator[account];
    }

    /// @notice Returns whether the given address has approved ther assets to ApproveController.
    function _isApprover(address account) internal view returns (bool) {
        return controller.isApproved(account);
    }
}
