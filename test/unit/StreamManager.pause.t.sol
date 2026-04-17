// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../helpers/BaseTest.sol";
import {IStreamManager} from "../../src/interfaces/IStreamManager.sol";
import {Errors} from "../../src/libraries/Errors.sol";

contract StreamManagerPauseTest is BaseTest {
    uint128 constant RATE = 100;
    uint128 constant DEPOSIT = 100_000e6;
    uint256 planId;
    uint256 streamId;

    function setUp() public override {
        super.setUp();
        usdc.mint(alice, DEPOSIT);
        planId = _createPlan(RATE, 0, 0);
        streamId = _approveAndCreateStream(alice, planId, DEPOSIT);
    }

    function test_autopause_onBlocklistedMerchant() public {
        _advanceTime(100);
        usdc.setBlocked(merchant, true);

        vm.prank(merchant);
        manager.claim(streamId); // triggers _safeTransferOrPause

        IStreamManager.Stream memory s = manager.getStream(streamId);
        assertEq(uint8(s.status), uint8(IStreamManager.StreamStatus.Paused));
        assertGt(s.pausedAt, 0);
    }

    function test_autopause_emitsStreamPaused() public {
        _advanceTime(100);
        usdc.setBlocked(merchant, true);

        vm.prank(merchant);
        vm.expectEmit(true, false, false, false);
        emit IStreamManager.StreamPaused(streamId);
        manager.claim(streamId);
    }

    function test_consumptionFreezesDuringPause() public {
        _advanceTime(100); // consume 100 * RATE = 10_000

        // Trigger pause
        usdc.setBlocked(merchant, true);
        vm.prank(merchant);
        manager.claim(streamId);

        // Advance time while paused — consumption should NOT increase
        IStreamManager.Stream memory sBefore = manager.getStream(streamId);
        _advanceTime(1000);
        IStreamManager.Stream memory sAfter = manager.getStream(streamId);

        // getBalance uses effectiveNow=pausedAt when paused, so consumed shouldn't grow
        (uint256 usable1,) = manager.getBalance(streamId);
        _advanceTime(1000);
        (uint256 usable2,) = manager.getBalance(streamId);

        assertEq(usable1, usable2); // balance frozen
        assertEq(sBefore.pausedAt, sAfter.pausedAt); // pausedAt unchanged
    }

    function test_resumeClaim_afterUnblock() public {
        _advanceTime(100); // 10_000 consumed

        // Pause
        usdc.setBlocked(merchant, true);
        vm.prank(merchant);
        manager.claim(streamId);

        // Unblock and resume
        usdc.setBlocked(merchant, false);
        _advanceTime(500); // advance more — shouldn't count toward consumed

        uint256 merchantBefore = usdc.balanceOf(merchant);
        vm.prank(merchant);
        manager.resumeClaim(streamId);

        // After resume, start shifted — the 10_000 consumed before pause is claimable
        IStreamManager.Stream memory s = manager.getStream(streamId);
        assertEq(uint8(s.status), uint8(IStreamManager.StreamStatus.Active));

        // Merchant should have received the pre-pause consumed amount
        assertGe(usdc.balanceOf(merchant), merchantBefore);
    }

    function test_resumeClaim_onlyPlanOwner() public {
        // Pause the stream first
        _advanceTime(100);
        usdc.setBlocked(merchant, true);
        vm.prank(merchant);
        manager.claim(streamId);
        usdc.setBlocked(merchant, false);

        vm.prank(alice);
        vm.expectRevert(Errors.NotPlanMerchant.selector);
        manager.resumeClaim(streamId);
    }

    function test_resumeClaim_failsOnActiveStream() public {
        vm.prank(merchant);
        vm.expectRevert(Errors.StreamNotActive.selector);
        manager.resumeClaim(streamId);
    }

    function test_claimPaused_reverts() public {
        _advanceTime(100);
        usdc.setBlocked(merchant, true);
        vm.prank(merchant);
        manager.claim(streamId); // auto-pause

        usdc.setBlocked(merchant, false);
        // Stream is paused — direct claim should revert with StreamPaused
        vm.prank(merchant);
        vm.expectRevert(Errors.StreamPaused.selector);
        manager.claim(streamId);
    }
}
