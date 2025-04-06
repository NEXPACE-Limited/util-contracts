// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IExec {
    struct Call {
        address to;
        bytes data;
        uint256 value;
    }

    function exec(address to, bytes memory data, uint256 value) external payable;

    function batchExec(Call[] calldata calls) external payable;
}
