// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../helpers/BaseTest.sol";
import {IStreamManager} from "../../src/interfaces/IStreamManager.sol";
import {Errors} from "../../src/libraries/Errors.sol";

contract StreamManagerCreateTest is BaseTest {
    uint128 constant RATE = 100; // 100 wei-USDC/sec
    uint256 planId;

    function setUp() public override {
        super.setUp();
        planId = _createPlan(RATE, 0, 0);
    }

    function test_createStream_happyPath() public {
        uint128 deposit = 10_000;
        uint256 streamId = _approveAndCreateStream(alice, planId, deposit);

        IStreamManager.Stream memory s = manager.getStream(streamId);
        assertEq(s.planId, planId);
        assertEq(s.payer, alice);
        assertEq(s.deposited, deposit);
        assertEq(uint8(s.status), uint8(IStreamManager.StreamStatus.Active));
    }

    function test_createStream_transfersUSDC() public {
        uint128 deposit = 5_000;
        uint256 balBefore = usdc.balanceOf(address(manager));
        _approveAndCreateStream(alice, planId, deposit);
        assertEq(usdc.balanceOf(address(manager)), balBefore + deposit);
    }

    function test_createStream_emitsEvent() public {
        uint128 deposit = 1000;
        vm.startPrank(alice);
        usdc.approve(address(manager), deposit);
        vm.expectEmit(true, true, true, true);
        emit IStreamManager.StreamCreated(1, planId, alice, deposit);
        manager.createStream(planId, deposit);
        vm.stopPrank();
    }

    function test_createStream_incrementsStreamId() public {
        uint256 id1 = _approveAndCreateStream(alice, planId, 1000);
        uint256 id2 = _approveAndCreateStream(alice, planId, 1000);
        assertEq(id1, 1);
        assertEq(id2, 2);
    }

    function test_createStream_revertsOnInactivePlan() public {
        vm.prank(merchant);
        registry.deactivatePlan(planId);

        vm.prank(alice);
        usdc.approve(address(manager), 1000);
        vm.prank(alice);
        vm.expectRevert(Errors.PlanNotActive.selector);
        manager.createStream(planId, 1000);
    }

    function test_createStream_revertsOnZeroDeposit() public {
        vm.prank(alice);
        vm.expectRevert(Errors.ZeroDeposit.selector);
        manager.createStream(planId, 0);
    }

    function test_createStream_revertsOnDepositTooSmall() public {
        // deposit < ratePerSecond (100) — less than 1 second of funding
        vm.prank(alice);
        usdc.approve(address(manager), 50);
        vm.prank(alice);
        vm.expectRevert(Errors.DepositTooSmall.selector);
        manager.createStream(planId, 50);
    }

    function test_createStream_revertsOnInsufficientAllowance() public {
        vm.startPrank(alice);
        usdc.approve(address(manager), 100); // only approves 100
        vm.expectRevert();
        manager.createStream(planId, 5000);
        vm.stopPrank();
    }
}
