// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../helpers/BaseTest.sol";
import {IDisputeResolver} from "../../src/interfaces/IDisputeResolver.sol";
import {IStreamManager} from "../../src/interfaces/IStreamManager.sol";
import {Errors} from "../../src/libraries/Errors.sol";
import {DisputeResolver} from "../../src/DisputeResolver.sol";

contract DisputeResolverOpenTest is BaseTest {
    uint128 constant RATE = 100;
    uint128 constant DEPOSIT = 100_000e6;
    uint256 planId;
    uint256 streamId;
    DisputeResolver resolver;

    function setUp() public override {
        super.setUp();
        usdc.mint(alice, DEPOSIT);
        planId = _createPlan(RATE, 0, 0);
        streamId = _approveAndCreateStream(alice, planId, DEPOSIT);

        resolver = new DisputeResolver(address(manager), address(usdc));
        manager.setDisputeResolver(address(resolver));
    }

    function test_openDispute_happyPath() public {
        _advanceTime(1000); // 1000 * 100 = 100_000 consumed

        uint128 bond = RATE * 86400; // 1 day rate
        uint128 disputeAmt = 5000;
        uint256 aliceBefore = usdc.balanceOf(alice);

        vm.startPrank(alice);
        usdc.approve(address(resolver), bond);
        uint256 disputeId = resolver.openDispute(streamId, disputeAmt);
        vm.stopPrank();

        assertEq(disputeId, 1);
        assertEq(usdc.balanceOf(alice), aliceBefore - bond);

        IDisputeResolver.Dispute memory d = resolver.getDispute(disputeId);
        assertEq(d.streamId, streamId);
        assertEq(d.subscriber, alice);
        assertEq(d.frozenAmount, disputeAmt);
        assertEq(d.bond, bond);
        assertEq(uint8(d.status), uint8(IDisputeResolver.DisputeStatus.Open));

        IStreamManager.Stream memory s = manager.getStream(streamId);
        assertEq(s.frozen, disputeAmt);
    }

    function test_openDispute_emitsEvent() public {
        _advanceTime(1000);
        uint128 bond = RATE * 86400;
        vm.startPrank(alice);
        usdc.approve(address(resolver), bond);
        vm.expectEmit(true, true, true, true);
        emit IDisputeResolver.DisputeOpened(1, streamId, alice, 5000);
        resolver.openDispute(streamId, 5000);
        vm.stopPrank();
    }

    function test_openDispute_incrementsId() public {
        _advanceTime(2000);
        uint128 bond = RATE * 86400;

        vm.startPrank(alice);
        usdc.approve(address(resolver), bond * 2);
        uint256 id1 = resolver.openDispute(streamId, 1000);
        vm.stopPrank();

        usdc.mint(alice, DEPOSIT); // fund alice for second stream
        uint256 streamId2 = _approveAndCreateStream(alice, planId, DEPOSIT);
        _advanceTime(1000);
        vm.startPrank(alice);
        usdc.approve(address(resolver), bond);
        uint256 id2 = resolver.openDispute(streamId2, 1000);
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
    }

    function test_openDispute_revertsIfNotSubscriber() public {
        _advanceTime(1000);
        uint128 bond = RATE * 86400;
        vm.startPrank(bob);
        usdc.approve(address(resolver), bond);
        vm.expectRevert(Errors.NotDisputeSubscriber.selector);
        resolver.openDispute(streamId, 5000);
        vm.stopPrank();
    }

    function test_openDispute_revertsOnZeroAmount() public {
        _advanceTime(1000);
        uint128 bond = RATE * 86400;
        vm.startPrank(alice);
        usdc.approve(address(resolver), bond);
        vm.expectRevert(Errors.ZeroDisputeAmount.selector);
        resolver.openDispute(streamId, 0);
        vm.stopPrank();
    }

    function test_openDispute_revertsIfAmountExceedsClaimable() public {
        _advanceTime(100); // only 10_000 consumed
        uint128 bond = RATE * 86400;
        vm.startPrank(alice);
        usdc.approve(address(resolver), bond);
        vm.expectRevert(Errors.DisputeAmountTooLarge.selector);
        resolver.openDispute(streamId, 50_000); // more than consumed
        vm.stopPrank();
    }

    function test_openDispute_freezesStreamBalance() public {
        _advanceTime(1000);
        uint128 bond = RATE * 86400;
        uint128 disputeAmt = 20_000;

        vm.startPrank(alice);
        usdc.approve(address(resolver), bond);
        resolver.openDispute(streamId, disputeAmt);
        vm.stopPrank();

        // Merchant should not be able to claim the frozen amount
        uint256 merchantBefore = usdc.balanceOf(merchant);
        vm.prank(merchant);
        manager.claim(streamId);
        // Claimed amount should be reduced by frozen
        uint256 merchantGained = usdc.balanceOf(merchant) - merchantBefore;
        assertLt(merchantGained, 1000 * RATE); // less than full consumed
    }
}
