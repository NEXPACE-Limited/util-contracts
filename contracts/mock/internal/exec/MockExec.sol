// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Exec } from "../../../exec/Exec.sol";

contract MockExec is Exec {
    event MockBeforeEachExecCalled(address to, bytes data, uint256 value);
    event MockAfterEachExecCalled(address to, bytes data, uint256 value);
    event MockBeforeExecCalled();
    event MockAfterExecCalled();

    function _beforeEachExec(address to, bytes memory data, uint256 value) internal virtual override {
        emit MockBeforeEachExecCalled(to, data, value);
    }

    function _afterEachExec(address to, bytes memory data, uint256 value) internal virtual override {
        emit MockAfterEachExecCalled(to, data, value);
    }

    function _beforeExec() internal virtual override {
        emit MockBeforeExecCalled();
    }

    function _afterExec() internal virtual override {
        emit MockAfterExecCalled();
    }
}
