// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ApproveController } from "../../../approve/ApproveController.sol";
import { ApproveControlled } from "../../../approve/ApproveControlled.sol";

contract MockApproveController is ApproveController {
    constructor(address trustedForwarder_) ApproveController(trustedForwarder_) {}

    // For coverage
    function getMsgData() external view virtual {
        _msgData();
    }
}
