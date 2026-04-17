// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSDC} from "../helpers/MockUSDC.sol";
import {PlanRegistry} from "../../src/PlanRegistry.sol";
import {StreamManager} from "../../src/StreamManager.sol";
import {IStreamManager} from "../../src/interfaces/IStreamManager.sol";

contract StreamManagerHandler is Test {
    MockUSDC public usdc;
    PlanRegistry public registry;
    StreamManager public manager;

    address public alice = makeAddr("alice");
    address public merchant = makeAddr("merchant");
    address internal constant PERMIT2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    uint256[] private _streamIds;

    function streamIds(uint256 i) public view returns (uint256) { return _streamIds[i]; }
    function streamIds_length() public view returns (uint256) { return _streamIds.length; }
    uint256 public planId;

    uint256 public totalDeposited;
    uint256 public totalRefunded;
    uint256 public totalClaimed;

    constructor() {
        usdc = new MockUSDC();
        registry = new PlanRegistry();
        manager = new StreamManager(address(usdc), address(registry), PERMIT2);

        usdc.mint(alice, 1_000_000_000e6);

        vm.prank(merchant);
        planId = registry.createPlan(100, 0, 0); // 100 wei-USDC/sec
    }

    function createStream(uint128 deposit) public {
        deposit = uint128(bound(deposit, 100, 10_000e6));
        vm.startPrank(alice);
        usdc.approve(address(manager), deposit);
        uint256 id = manager.createStream(planId, deposit);
        vm.stopPrank();
        _streamIds.push(id);
        totalDeposited += deposit;
    }

    function cancel(uint256 idx) public {
        if (_streamIds.length == 0) return;
        idx = bound(idx, 0, _streamIds.length - 1);
        uint256 id = _streamIds[idx];
        IStreamManager.Stream memory s = manager.getStream(id);
        if (s.status == IStreamManager.StreamStatus.Cancelled) return;
        if (s.payer != alice) return;

        uint256 before = usdc.balanceOf(alice);
        vm.prank(alice);
        try manager.cancel(id) {
            totalRefunded += usdc.balanceOf(alice) - before;
        } catch {}
    }

    function claim(uint256 idx) public {
        if (_streamIds.length == 0) return;
        idx = bound(idx, 0, _streamIds.length - 1);
        uint256 id = _streamIds[idx];

        uint256 before = usdc.balanceOf(merchant);
        vm.prank(merchant);
        try manager.claim(id) {
            totalClaimed += usdc.balanceOf(merchant) - before;
        } catch {}
    }

    function topUp(uint256 idx, uint128 amount) public {
        if (_streamIds.length == 0) return;
        idx = bound(idx, 0, _streamIds.length - 1);
        amount = uint128(bound(amount, 100, 1_000e6));
        uint256 id = _streamIds[idx];
        IStreamManager.Stream memory s = manager.getStream(id);
        if (s.status == IStreamManager.StreamStatus.Cancelled) return;

        vm.startPrank(alice);
        usdc.approve(address(manager), amount);
        try manager.topUp(id, amount) {
            totalDeposited += amount;
        } catch {}
        vm.stopPrank();
    }

    function advanceTime(uint32 secs) public {
        secs = uint32(bound(secs, 1, 86400));
        vm.warp(block.timestamp + secs);
        vm.roll(block.number + 1);
    }
}

contract StreamManagerInvariantTest is Test {
    StreamManagerHandler public handler;

    function setUp() public {
        handler = new StreamManagerHandler();
        targetContract(address(handler));
    }

    /// @dev Manager USDC balance == totalDeposited - totalRefunded - totalClaimed
    function invariant_balanceConservation() public view {
        uint256 managerBal = handler.usdc().balanceOf(address(handler.manager()));
        assertEq(
            managerBal,
            handler.totalDeposited() - handler.totalRefunded() - handler.totalClaimed(),
            "balance conservation violated"
        );
    }

    /// @dev For each stream: consumed <= deposited
    function invariant_consumedLeqDeposited() public view {
        StreamManager mgr = handler.manager();
        uint256 len = handler.streamIds_length();
        for (uint256 i = 0; i < len; i++) {
            uint256 id = handler.streamIds(i);
            IStreamManager.Stream memory s = mgr.getStream(id);
            assertLe(s.consumed, s.deposited, "consumed > deposited");
        }
    }

    /// @dev For each stream: claimed <= consumed
    function invariant_claimedLeqConsumed() public view {
        StreamManager mgr = handler.manager();
        uint256 len = handler.streamIds_length();
        for (uint256 i = 0; i < len; i++) {
            uint256 id = handler.streamIds(i);
            IStreamManager.Stream memory s = mgr.getStream(id);
            assertLe(s.claimed, s.consumed, "claimed > consumed");
        }
    }
}
