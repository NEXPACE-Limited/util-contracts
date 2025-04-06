// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ApproveController } from "../../../approve/ApproveController.sol";
import { ApproveControlled } from "../../../approve/ApproveControlled.sol";

contract MockApproveControlled is ApproveControlled {
    constructor(ApproveController controller_) ApproveControlled(controller_) {}

    function isApprover(address account) external view returns (bool) {
        return _isApprover(account);
    }
}
