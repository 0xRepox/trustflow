// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../helpers/BaseTest.sol";
import {IDisputeResolver} from "../../src/interfaces/IDisputeResolver.sol";
import {Errors} from "../../src/libraries/Errors.sol";
import {DisputeResolver} from "../../src/DisputeResolver.sol";

contract DisputeResolverRespondTest is BaseTest {
    uint128 constant RATE = 100;
    uint128 constant DEPOSIT = 100_000e6;
    uint256 planId;
    uint256 streamId;
    uint256 disputeId;
    DisputeResolver resolver;
    bytes32 constant EVIDENCE = keccak256("ipfs://QmEvidence");

    function setUp() public override {
        super.setUp();
        usdc.mint(alice, DEPOSIT);
        planId = _createPlan(RATE, 0, 0);
        streamId = _approveAndCreateStream(alice, planId, DEPOSIT);
        resolver = new DisputeResolver(address(manager), address(usdc));
        manager.setDisputeResolver(address(resolver));

        _advanceTime(1000);
        uint128 bond = RATE * 86400;
        vm.startPrank(alice);
        usdc.approve(address(resolver), bond);
        disputeId = resolver.openDispute(streamId, 5000);
        vm.stopPrank();
    }

    function test_respondToDispute_success() public {
        vm.prank(merchant);
        resolver.respondToDispute(disputeId, EVIDENCE);

        IDisputeResolver.Dispute memory d = resolver.getDispute(disputeId);
        assertEq(d.evidenceHash, EVIDENCE);
        assertEq(uint8(d.status), uint8(IDisputeResolver.DisputeStatus.Responded));
    }

    function test_respondToDispute_emitsEvent() public {
        vm.prank(merchant);
        vm.expectEmit(true, false, false, true);
        emit IDisputeResolver.DisputeResponded(disputeId, EVIDENCE);
        resolver.respondToDispute(disputeId, EVIDENCE);
    }

    function test_respondToDispute_revertsIfNotMerchant() public {
        vm.prank(bob);
        vm.expectRevert(Errors.NotDisputeMerchant.selector);
        resolver.respondToDispute(disputeId, EVIDENCE);
    }

    function test_respondToDispute_revertsAfterDeadline() public {
        _advanceTime(8 * 86400); // past 7-day window
        vm.prank(merchant);
        vm.expectRevert(Errors.RespondWindowExpired.selector);
        resolver.respondToDispute(disputeId, EVIDENCE);
    }

    function test_respondToDispute_revertsIfAlreadySettled() public {
        // Arbitrate first
        vm.prank(merchant);
        resolver.respondToDispute(disputeId, EVIDENCE);
        resolver.arbitrate(disputeId, IDisputeResolver.Verdict.Merchant);

        vm.prank(merchant);
        vm.expectRevert(Errors.DisputeAlreadySettled.selector);
        resolver.respondToDispute(disputeId, EVIDENCE);
    }
}
