// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../helpers/BaseTest.sol";
import {IDisputeResolver} from "../../src/interfaces/IDisputeResolver.sol";
import {IStreamManager} from "../../src/interfaces/IStreamManager.sol";
import {Errors} from "../../src/libraries/Errors.sol";
import {DisputeResolver} from "../../src/DisputeResolver.sol";

contract DisputeResolverSettleTest is BaseTest {
    uint128 constant RATE = 100;
    uint128 constant DEPOSIT = 100_000e6;
    uint256 planId;
    uint256 streamId;
    uint256 disputeId;
    DisputeResolver resolver;
    uint128 bond;
    uint128 constant FROZEN = 5000;

    function setUp() public override {
        super.setUp();
        usdc.mint(alice, DEPOSIT);
        planId = _createPlan(RATE, 0, 0);
        streamId = _approveAndCreateStream(alice, planId, DEPOSIT);
        resolver = new DisputeResolver(address(manager), address(usdc));
        manager.setDisputeResolver(address(resolver));

        _advanceTime(1000);
        bond = RATE * 86400;
        vm.startPrank(alice);
        usdc.approve(address(resolver), bond);
        disputeId = resolver.openDispute(streamId, FROZEN);
        vm.stopPrank();

        vm.prank(merchant);
        resolver.respondToDispute(disputeId, keccak256("evidence"));
    }

    function test_arbitrate_subscriberVerdict() public {
        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 merchantBefore = usdc.balanceOf(merchant);

        resolver.arbitrate(disputeId, IDisputeResolver.Verdict.Subscriber);

        // Subscriber gets frozen + bond back
        assertEq(usdc.balanceOf(alice), aliceBefore + FROZEN + bond);
        // Merchant gets nothing extra
        assertEq(usdc.balanceOf(merchant), merchantBefore);

        IDisputeResolver.Dispute memory d = resolver.getDispute(disputeId);
        assertEq(uint8(d.status), uint8(IDisputeResolver.DisputeStatus.Settled));
        assertEq(uint8(d.verdict), uint8(IDisputeResolver.Verdict.Subscriber));

        // Stream frozen should be cleared
        IStreamManager.Stream memory s = manager.getStream(streamId);
        assertEq(s.frozen, 0);
    }

    function test_arbitrate_merchantVerdict() public {
        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 merchantBefore = usdc.balanceOf(merchant);

        resolver.arbitrate(disputeId, IDisputeResolver.Verdict.Merchant);

        // Subscriber gets bond back only
        assertEq(usdc.balanceOf(alice), aliceBefore + bond);
        // Merchant gets frozen amount
        assertEq(usdc.balanceOf(merchant), merchantBefore + FROZEN);

        IDisputeResolver.Dispute memory d = resolver.getDispute(disputeId);
        assertEq(uint8(d.verdict), uint8(IDisputeResolver.Verdict.Merchant));
    }

    function test_arbitrate_splitVerdict() public {
        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 merchantBefore = usdc.balanceOf(merchant);

        resolver.arbitrate(disputeId, IDisputeResolver.Verdict.Split);

        uint128 half = FROZEN / 2;
        // Subscriber gets half frozen + bond
        assertEq(usdc.balanceOf(alice), aliceBefore + half + bond);
        // Merchant gets other half
        assertEq(usdc.balanceOf(merchant), merchantBefore + (FROZEN - half));
    }

    function test_arbitrate_emitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit IDisputeResolver.DisputeSettled(disputeId, IDisputeResolver.Verdict.Merchant, 0, FROZEN);
        resolver.arbitrate(disputeId, IDisputeResolver.Verdict.Merchant);
    }

    function test_arbitrate_onlyArbitrator() public {
        vm.prank(alice);
        vm.expectRevert(Errors.NotArbitrator.selector);
        resolver.arbitrate(disputeId, IDisputeResolver.Verdict.Merchant);
    }

    function test_arbitrate_revertsIfAlreadySettled() public {
        resolver.arbitrate(disputeId, IDisputeResolver.Verdict.Merchant);
        vm.expectRevert(Errors.DisputeAlreadySettled.selector);
        resolver.arbitrate(disputeId, IDisputeResolver.Verdict.Subscriber);
    }

    function test_defaultSettle_proSubscriberAfterDeadline() public {
        // Open a new dispute with no response
        usdc.mint(alice, DEPOSIT);
        uint256 streamId2 = _approveAndCreateStream(alice, planId, DEPOSIT);
        _advanceTime(1000);
        vm.startPrank(alice);
        usdc.approve(address(resolver), bond);
        uint256 dId = resolver.openDispute(streamId2, FROZEN);
        vm.stopPrank();

        // Advance past respond deadline
        _advanceTime(8 * 86400);

        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 merchantBefore = usdc.balanceOf(merchant);

        resolver.defaultSettle(dId);

        // Subscriber wins: gets frozen amount + bond back; merchant gets nothing
        assertEq(usdc.balanceOf(alice), aliceBefore + FROZEN + bond);
        assertEq(usdc.balanceOf(merchant), merchantBefore);

        IDisputeResolver.Dispute memory d = resolver.getDispute(dId);
        assertEq(uint8(d.status), uint8(IDisputeResolver.DisputeStatus.Settled));
        assertEq(uint8(d.verdict), uint8(IDisputeResolver.Verdict.Subscriber));
    }

    function test_defaultSettle_revertsBeforeDeadline() public {
        usdc.mint(alice, DEPOSIT);
        uint256 streamId2 = _approveAndCreateStream(alice, planId, DEPOSIT);
        _advanceTime(1000);
        vm.startPrank(alice);
        usdc.approve(address(resolver), bond);
        uint256 dId = resolver.openDispute(streamId2, FROZEN);
        vm.stopPrank();

        // Not past deadline yet
        vm.expectRevert(Errors.RespondWindowActive.selector);
        resolver.defaultSettle(dId);
    }

    function test_defaultSettle_revertsIfAlreadyResponded() public {
        _advanceTime(8 * 86400);
        // disputeId already has a response (from setUp)
        vm.expectRevert(Errors.DisputeAlreadyResponded.selector);
        resolver.defaultSettle(disputeId);
    }
}
