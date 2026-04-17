// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPlanRegistry {
    struct Plan {
        address owner;
        uint128 ratePerSecond;
        uint32 gracePeriod;
        uint8 disputePolicy;
        bool active;
    }

    event PlanCreated(uint256 indexed planId, address indexed owner, uint128 ratePerSecond);
    event PlanUpdated(uint256 indexed planId, uint128 ratePerSecond, uint32 gracePeriod, uint8 disputePolicy);
    event PlanDeactivated(uint256 indexed planId);

    function createPlan(uint128 ratePerSecond, uint32 gracePeriod, uint8 disputePolicy)
        external
        returns (uint256 planId);

    function updatePlan(uint256 planId, uint128 ratePerSecond, uint32 gracePeriod, uint8 disputePolicy) external;

    function deactivatePlan(uint256 planId) external;

    function getPlan(uint256 planId) external view returns (Plan memory);

    function isActive(uint256 planId) external view returns (bool);
}
