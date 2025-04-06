// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Extends Ownable to provide two-level role management functionalities: owner and executors.
contract NextOwnable is Context, Ownable {
    mapping(address => bool) private _isExecutor;

    event ExecutorGranted(address indexed account);
    event ExecutorRevoked(address indexed account);

    modifier onlyAtLeastExecutor() {
        _checkAtLeastExecutor(_msgSender());
        _;
    }

    /// @notice Grant the given address executor role. Only owner can call.
    function grantExecutor(address executor) external virtual onlyOwner {
        _grantExecutor(executor);
    }

    /// @notice Revoke executor role from the given address. Only owner can call.
    function revokeExecutor(address executor) external virtual onlyOwner {
        _revokeExecutor(executor);
    }

    /// @notice Returns true if the given address is an executor.
    function isExecutor(address account) public view virtual returns (bool) {
        return _isExecutor[account];
    }

    /// @notice Returns true if the give address is either the owner or an executor.
    function isAtLeastExecutor(address account) public view virtual returns (bool) {
        return _isExecutor[account] || account == owner();
    }

    /// @notice Grant the given address executor role.
    function _grantExecutor(address executor) internal virtual {
        require(!_isExecutor[executor], "NextOwnable/grantExecutorConflict: account is already an executor");
        _isExecutor[executor] = true;
        emit ExecutorGranted(executor);
    }

    /// @notice Revoke executor role from the given address.
    function _revokeExecutor(address executor) internal virtual {
        require(_isExecutor[executor], "NextOwnable/revokeExecutorConflict: account is already a non-executor");
        _isExecutor[executor] = false;
        emit ExecutorRevoked(executor);
    }

    /// @notice Reverts if the given address is not the owner.
    function _checkOwner(address account) internal view virtual {
        require(owner() == account, "NextOwnable/ownerForbidden: account is not the owner");
    }

    /// @notice Reverts if the given address it neither the owner nor an executor.
    function _checkAtLeastExecutor(address account) internal view virtual {
        require(
            _isExecutor[account] || owner() == account,
            "NextOwnable/executorForbidden: account is neither the owner nor an executor"
        );
    }
}
