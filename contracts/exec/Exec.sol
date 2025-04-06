// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { IExec } from "./interfaces/IExec.sol";

/// @notice Provides exec and batchExec function for contracts that behave like a smart contract wallet.
///
/// Although exec and batchExec function is payable and not prohibiting storing the received native
/// tokens, by default, all the received native tokens should be spent before the exec or batchExec returns, and it is
/// caller's responsibility to match the transaction's value and the total amount of native tokens being spent.
///
/// Note that NativeERC20 contract can move this contract's token even if the internal call has zero value.
contract Exec is IExec {
    /// @notice Makes an arbitrary internal transaction with the given to, data and value.
    function exec(address to, bytes memory data, uint256 value) external payable override {
        _beforeExec();
        _exec(to, data, value);
        _afterExec();
    }

    /// @notice Makes arbitrary internal transactions in batch.
    function batchExec(Call[] calldata calls) external payable override {
        _beforeExec();
        for (uint256 i = 0; i < calls.length; i++) {
            Call calldata call = calls[i];
            _exec(call.to, call.data, call.value);
        }
        _afterExec();
    }

    /// @notice Callback function which is called before each internal transaction is made.
    function _beforeEachExec(address to, bytes memory data, uint256 value) internal virtual {}

    /// @notice Callback function which is called after each internal transaction is made.
    function _afterEachExec(address to, bytes memory data, uint256 value) internal virtual {}

    /// @notice Callback function which is called at the beginning of either exec or batchExec.
    function _beforeExec() internal virtual {}

    /// @notice Callback function which is called at the end of either exec or batchExec.
    function _afterExec() internal virtual {}

    /// @notice A low-level function that makes a low-level internal transaction.
    function _exec(address to, bytes memory data, uint256 value) private {
        _beforeEachExec(to, data, value);
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returnData) = to.call{ value: value }(data);
        Address.verifyCallResult(success, returnData, "Exec/noReason: low-level call failed");
        _afterEachExec(to, data, value);
    }
}
