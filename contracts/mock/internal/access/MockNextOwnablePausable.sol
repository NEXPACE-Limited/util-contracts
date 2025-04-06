// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { NextOwnablePausable } from "../../../access/NextOwnablePausable.sol";

contract MockNextOwnablePausable is NextOwnablePausable {
    function testWhenExecutable() external view whenExecutable {}

    function testWhenPaused() external view whenPaused {}

    function testWhenNotPaused() external view whenNotPaused {}

    function checkExecutable(address account) external view {
        _checkExecutable(account);
    }

    function checkPaused() external view {
        _checkPaused();
    }

    function checkNotPaused() external view {
        _checkNotPaused();
    }

    function isExecutable(address account) external view returns (bool) {
        return _isExecutable(account);
    }
}
