// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { NextOwnable } from "../../../access/NextOwnable.sol";

contract MockNextOwnable is NextOwnable {
    function testOnlyOwner() external view onlyOwner {}

    function testOnlyAtLeastExecutor() external view onlyAtLeastExecutor {}

    function checkOwner(address account) external view {
        _checkOwner(account);
    }

    function checkAtLeastExecutor(address account) external view {
        _checkAtLeastExecutor(account);
    }
}
