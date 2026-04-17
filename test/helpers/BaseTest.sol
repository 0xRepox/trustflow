// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "./MockUSDC.sol";
import {PlanRegistry} from "../../src/PlanRegistry.sol";
import {StreamManager} from "../../src/StreamManager.sol";

contract BaseTest is Test {
    MockUSDC internal usdc;
    PlanRegistry internal registry;
    StreamManager internal manager;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal merchant = makeAddr("merchant");

    // Permit2 canonical address — unused in approve-path tests but constructor needs it
    address internal constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    uint256 internal constant INITIAL_BALANCE = 10_000e6; // 10,000 USDC

    function setUp() public virtual {
        usdc = new MockUSDC();
        registry = new PlanRegistry();
        manager = new StreamManager(address(usdc), address(registry), PERMIT2);

        usdc.mint(alice, INITIAL_BALANCE);
        usdc.mint(bob, INITIAL_BALANCE);

        vm.label(alice, "alice");
        vm.label(bob, "bob");
        vm.label(merchant, "merchant");
    }

    function _createPlan(uint128 rate, uint32 grace, uint8 policy) internal returns (uint256 planId) {
        vm.prank(merchant);
        planId = registry.createPlan(rate, grace, policy);
    }

    function _approveAndCreateStream(address payer, uint256 planId, uint128 amount)
        internal
        returns (uint256 streamId)
    {
        vm.startPrank(payer);
        usdc.approve(address(manager), amount);
        streamId = manager.createStream(planId, amount);
        vm.stopPrank();
    }

    function _advanceTime(uint256 secs) internal {
        vm.warp(block.timestamp + secs);
        vm.roll(block.number + secs / 2); // approximate blocks
    }
}
