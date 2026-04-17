// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../helpers/BaseTest.sol";
import {IStreamManager} from "../../src/interfaces/IStreamManager.sol";
import {Errors} from "../../src/libraries/Errors.sol";

contract StreamManagerClaimTest is BaseTest {
    uint128 constant RATE = 100;
    uint128 constant DEPOSIT = 100_000e6; // large enough to avoid cap issues
    uint256 planId;
    uint256 streamId;

    function setUp() public override {
        super.setUp();
        // Give alice enough USDC for large deposit
        usdc.mint(alice, DEPOSIT);
        planId = _createPlan(RATE, 0, 0);
        streamId = _approveAndCreateStream(alice, planId, DEPOSIT);
    }

    function test_claim_merchantReceivesAccrued() public {
        _advanceTime(100);

        uint256 merchantBefore = usdc.balanceOf(merchant);
        vm.prank(merchant);
        manager.claim(streamId);

        assertEq(usdc.balanceOf(merchant), merchantBefore + 100 * RATE);
    }

    function test_claim_onlyPlanOwner() public {
        _advanceTime(100);
        vm.prank(alice);
        vm.expectRevert(Errors.NotPlanMerchant.selector);
        manager.claim(streamId);
    }

    function test_claim_doubleClaimSameBlock_yieldsZero() public {
        _advanceTime(100);

        vm.prank(merchant);
        manager.claim(streamId);

        uint256 merchantBefore = usdc.balanceOf(merchant);
        vm.prank(merchant);
        manager.claim(streamId); // second claim, same block

        assertEq(usdc.balanceOf(merchant), merchantBefore); // no new tokens
    }

    function test_claim_afterCancel() public {
        _advanceTime(50); // 50 * 100 = 5000 consumed

        vm.prank(alice);
        manager.cancel(streamId);

        uint256 merchantBefore = usdc.balanceOf(merchant);
        vm.prank(merchant);
        manager.claim(streamId);

        assertEq(usdc.balanceOf(merchant), merchantBefore + 5000);
    }

    function test_claim_dailyCapEnforced() public {
        // daily cap = RATE * 86400 * 2 = 100 * 86400 * 2 = 17_280_000
        uint128 dailyCap = RATE * 86400 * 2;

        // advance 3 days worth of time
        _advanceTime(3 * 86400);

        // First claim within cap
        vm.prank(merchant);
        manager.claim(streamId);

        // The claim should succeed but be capped — we check the merchant got at most dailyCap
        // (stream consumed = 3*86400*RATE but daily window caps at dailyCap)
        // Actually after first claim resets window, let's verify by claiming again immediately
        // after advancing just past another window
        _advanceTime(1); // same window

        vm.prank(merchant);
        vm.expectRevert(Errors.ClaimCapExceeded.selector);
        manager.claim(streamId); // already claimed dailyCap in this window
    }

    function test_claim_blocklist_pausesStream() public {
        _advanceTime(100);

        // Block merchant so USDC transfer to them reverts
        usdc.setBlocked(merchant, true);

        vm.prank(merchant);
        manager.claim(streamId); // should not revert — should pause stream

        IStreamManager.Stream memory s = manager.getStream(streamId);
        assertEq(uint8(s.status), uint8(IStreamManager.StreamStatus.Paused));
    }

    function test_claim_emitsEvent() public {
        _advanceTime(100);
        vm.prank(merchant);
        vm.expectEmit(true, true, false, true);
        emit IStreamManager.Claimed(streamId, merchant, uint128(100 * RATE));
        manager.claim(streamId);
    }
}
