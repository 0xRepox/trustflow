// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../helpers/BaseTest.sol";
import {IStreamManager} from "../../src/interfaces/IStreamManager.sol";
import {Errors} from "../../src/libraries/Errors.sol";

contract StreamManagerTopUpTest is BaseTest {
    uint128 constant RATE = 100;
    uint128 constant DEPOSIT = 10_000;
    uint256 planId;
    uint256 streamId;

    function setUp() public override {
        super.setUp();
        planId = _createPlan(RATE, 0, 0);
        streamId = _approveAndCreateStream(alice, planId, DEPOSIT);
    }

    function test_topUp_extendsRunway() public {
        uint128 extra = 5_000;
        vm.startPrank(alice);
        usdc.approve(address(manager), extra);
        manager.topUp(streamId, extra);
        vm.stopPrank();

        IStreamManager.Stream memory s = manager.getStream(streamId);
        assertEq(s.deposited, DEPOSIT + extra);
    }

    function test_topUp_transfersUSDC() public {
        uint128 extra = 2_000;
        uint256 managerBefore = usdc.balanceOf(address(manager));
        vm.startPrank(alice);
        usdc.approve(address(manager), extra);
        manager.topUp(streamId, extra);
        vm.stopPrank();

        assertEq(usdc.balanceOf(address(manager)), managerBefore + extra);
    }

    function test_topUp_emitsEvent() public {
        uint128 extra = 1_000;
        vm.startPrank(alice);
        usdc.approve(address(manager), extra);
        vm.expectEmit(true, false, false, true);
        emit IStreamManager.StreamToppedUp(streamId, extra);
        manager.topUp(streamId, extra);
        vm.stopPrank();
    }

    function test_topUp_onlyPayer() public {
        vm.startPrank(bob);
        usdc.approve(address(manager), 1000);
        vm.expectRevert(Errors.NotStreamPayer.selector);
        manager.topUp(streamId, 1000);
        vm.stopPrank();
    }

    function test_topUp_revertsOnCancelledStream() public {
        vm.prank(alice);
        manager.cancel(streamId);

        vm.startPrank(alice);
        usdc.approve(address(manager), 1000);
        vm.expectRevert(Errors.StreamNotActive.selector);
        manager.topUp(streamId, 1000);
        vm.stopPrank();
    }

    function test_topUp_revertsOnZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(Errors.ZeroDeposit.selector);
        manager.topUp(streamId, 0);
    }
}
