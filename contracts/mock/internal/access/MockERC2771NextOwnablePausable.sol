// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { ERC2771Context } from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import { MockNextOwnablePausable } from "./MockNextOwnablePausable.sol";

contract MockERC2771NextOwnablePausable is ERC2771Context, MockNextOwnablePausable {
    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    /* trivial overrides */

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
