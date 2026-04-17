// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPlanRegistry} from "./interfaces/IPlanRegistry.sol";
import {Errors} from "./libraries/Errors.sol";

contract PlanRegistry is IPlanRegistry {
    mapping(uint256 => Plan) private _plans;
    uint256 public nextPlanId = 1;

    function createPlan(uint128 ratePerSecond, uint32 gracePeriod, uint8 disputePolicy)
        external
        returns (uint256 planId)
    {
        if (ratePerSecond == 0) revert Errors.ZeroRate();
        planId = nextPlanId++;
        _plans[planId] = Plan({
            owner: msg.sender,
            ratePerSecond: ratePerSecond,
            gracePeriod: gracePeriod,
            disputePolicy: disputePolicy,
            active: true
        });
        emit PlanCreated(planId, msg.sender, ratePerSecond);
    }

    function updatePlan(uint256 planId, uint128 ratePerSecond, uint32 gracePeriod, uint8 disputePolicy) external {
        Plan storage plan = _plans[planId];
        if (plan.owner != msg.sender) revert Errors.NotPlanOwner();
        if (!plan.active) revert Errors.PlanNotActive();
        if (ratePerSecond == 0) revert Errors.ZeroRate();
        plan.ratePerSecond = ratePerSecond;
        plan.gracePeriod = gracePeriod;
        plan.disputePolicy = disputePolicy;
        emit PlanUpdated(planId, ratePerSecond, gracePeriod, disputePolicy);
    }

    function deactivatePlan(uint256 planId) external {
        Plan storage plan = _plans[planId];
        if (plan.owner != msg.sender) revert Errors.NotPlanOwner();
        plan.active = false;
        emit PlanDeactivated(planId);
    }

    function getPlan(uint256 planId) external view returns (Plan memory) {
        return _plans[planId];
    }

    function isActive(uint256 planId) external view returns (bool) {
        return _plans[planId].active;
    }
}
