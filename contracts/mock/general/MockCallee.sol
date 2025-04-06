// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockCallee {
    event MockCalled(bytes data, uint256 value);

    fallback() external payable {
        _fallback();
    }

    receive() external payable {
        _fallback();
    }

    function _fallback() internal virtual {
        emit MockCalled(msg.data, msg.value);
    }
}
