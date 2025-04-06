// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockReverter {
    function panicOutOfBound() external pure {
        new bytes(0)[1] = new bytes(0)[1]; // panic(0x32)
    }

    function revertYay() external pure {
        revert("Yay");
    }

    function revertWithoutReason() external pure {
        // solhint-disable-next-line reason-string
        revert();
    }
}
