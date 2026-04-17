// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../helpers/BaseTest.sol";
import {IPlanRegistry} from "../../src/interfaces/IPlanRegistry.sol";
import {Errors} from "../../src/libraries/Errors.sol";

contract PlanRegistryTest is BaseTest {
    uint128 constant RATE = 11; // ~$30/mo
    uint32 constant GRACE = 86400; // 1 day
    uint8 constant POLICY = 1;

    // ─── createPlan ──────────────────────────────────────────────────────────

    function test_createPlan_incrementsId() public {
        uint256 id1 = _createPlan(RATE, GRACE, POLICY);
        uint256 id2 = _createPlan(RATE, GRACE, POLICY);
        assertEq(id1, 1);
        assertEq(id2, 2);
    }

    function test_createPlan_emitsEvent() public {
        vm.prank(merchant);
        vm.expectEmit(true, true, false, true);
        emit IPlanRegistry.PlanCreated(1, merchant, RATE);
        registry.createPlan(RATE, GRACE, POLICY);
    }

    function test_createPlan_storesData() public {
        uint256 id = _createPlan(RATE, GRACE, POLICY);
        IPlanRegistry.Plan memory plan = registry.getPlan(id);
        assertEq(plan.owner, merchant);
        assertEq(plan.ratePerSecond, RATE);
        assertEq(plan.gracePeriod, GRACE);
        assertEq(plan.disputePolicy, POLICY);
        assertTrue(plan.active);
    }

    function test_createPlan_revertsOnZeroRate() public {
        vm.prank(merchant);
        vm.expectRevert(Errors.ZeroRate.selector);
        registry.createPlan(0, GRACE, POLICY);
    }

    function test_isActive_returnsTrueAfterCreate() public {
        uint256 id = _createPlan(RATE, GRACE, POLICY);
        assertTrue(registry.isActive(id));
    }

    // ─── updatePlan ──────────────────────────────────────────────────────────

    function test_updatePlan_success() public {
        uint256 id = _createPlan(RATE, GRACE, POLICY);

        vm.prank(merchant);
        vm.expectEmit(true, false, false, true);
        emit IPlanRegistry.PlanUpdated(id, 20, 3600, 2);
        registry.updatePlan(id, 20, 3600, 2);

        IPlanRegistry.Plan memory plan = registry.getPlan(id);
        assertEq(plan.ratePerSecond, 20);
        assertEq(plan.gracePeriod, 3600);
        assertEq(plan.disputePolicy, 2);
    }

    function test_updatePlan_revertsIfNotOwner() public {
        uint256 id = _createPlan(RATE, GRACE, POLICY);

        vm.prank(alice);
        vm.expectRevert(Errors.NotPlanOwner.selector);
        registry.updatePlan(id, 20, 3600, 2);
    }

    function test_updatePlan_revertsIfInactive() public {
        uint256 id = _createPlan(RATE, GRACE, POLICY);
        vm.prank(merchant);
        registry.deactivatePlan(id);

        vm.prank(merchant);
        vm.expectRevert(Errors.PlanNotActive.selector);
        registry.updatePlan(id, 20, 3600, 2);
    }

    function test_updatePlan_revertsOnZeroRate() public {
        uint256 id = _createPlan(RATE, GRACE, POLICY);
        vm.prank(merchant);
        vm.expectRevert(Errors.ZeroRate.selector);
        registry.updatePlan(id, 0, GRACE, POLICY);
    }

    // ─── deactivatePlan ──────────────────────────────────────────────────────

    function test_deactivatePlan_success() public {
        uint256 id = _createPlan(RATE, GRACE, POLICY);

        vm.prank(merchant);
        vm.expectEmit(true, false, false, false);
        emit IPlanRegistry.PlanDeactivated(id);
        registry.deactivatePlan(id);

        assertFalse(registry.isActive(id));
    }

    function test_deactivatePlan_revertsIfNotOwner() public {
        uint256 id = _createPlan(RATE, GRACE, POLICY);

        vm.prank(alice);
        vm.expectRevert(Errors.NotPlanOwner.selector);
        registry.deactivatePlan(id);
    }

    // ─── Fuzz ────────────────────────────────────────────────────────────────

    function test_fuzz_createPlan(uint128 rate, uint32 grace, uint8 policy) public {
        vm.assume(rate > 0);
        vm.prank(merchant);
        uint256 id = registry.createPlan(rate, grace, policy);

        IPlanRegistry.Plan memory plan = registry.getPlan(id);
        assertEq(plan.ratePerSecond, rate);
        assertEq(plan.gracePeriod, grace);
        assertEq(plan.disputePolicy, policy);
        assertTrue(plan.active);
    }
}
