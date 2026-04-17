// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../helpers/BaseTest.sol";
import {IStreamManager} from "../../src/interfaces/IStreamManager.sol";
import {Errors} from "../../src/libraries/Errors.sol";

contract StreamManagerCancelTest is BaseTest {
    uint128 constant RATE = 100;
    uint128 constant DEPOSIT = 10_000;
    uint256 planId;
    uint256 streamId;

    function setUp() public override {
        super.setUp();
        planId = _createPlan(RATE, 0, 0);
        streamId = _approveAndCreateStream(alice, planId, DEPOSIT);
    }

    function test_cancel_atT0_fullRefund() public {
        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        manager.cancel(streamId);

        assertEq(usdc.balanceOf(alice), aliceBefore + DEPOSIT);
        IStreamManager.Stream memory s = manager.getStream(streamId);
        assertEq(uint8(s.status), uint8(IStreamManager.StreamStatus.Cancelled));
    }

    function test_cancel_partialRefund() public {
        _advanceTime(100); // 100 sec * 100 rate = 10_000 consumed... but deposit is 10_000 so refund = 0
        // Use smaller RATE scenario
        // Actually 100 * 100 = 10000 = DEPOSIT, so refund = 0
        // Let's test with 50 seconds elapsed
        uint256 elapsed = 50;
        uint256 id = _approveAndCreateStream(alice, planId, DEPOSIT);
        _advanceTime(elapsed);

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        manager.cancel(id);

        uint256 consumed = elapsed * RATE;
        uint256 expectedRefund = DEPOSIT - consumed;
        assertEq(usdc.balanceOf(alice), aliceBefore + expectedRefund);
    }

    function test_cancel_onlyPayer() public {
        vm.prank(bob);
        vm.expectRevert(Errors.NotStreamPayer.selector);
        manager.cancel(streamId);
    }

    function test_cancel_doubleCancel_reverts() public {
        vm.prank(alice);
        manager.cancel(streamId);

        vm.prank(alice);
        vm.expectRevert(Errors.StreamNotActive.selector);
        manager.cancel(streamId);
    }

    function test_cancel_emitsEvent() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit IStreamManager.StreamCancelled(streamId, DEPOSIT, 0);
        manager.cancel(streamId);
    }

    function test_cancel_merchantCanClaimAccruedAfterCancel() public {
        _advanceTime(50); // 50 * 100 = 5000 consumed

        vm.prank(alice);
        manager.cancel(streamId);

        uint256 merchantBefore = usdc.balanceOf(merchant);
        vm.prank(merchant);
        manager.claim(streamId);

        assertEq(usdc.balanceOf(merchant), merchantBefore + 5000);
    }
}
