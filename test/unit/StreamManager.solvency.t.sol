// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "../helpers/BaseTest.sol";
import {IDisputeResolver} from "../../src/interfaces/IDisputeResolver.sol";
import {IStreamManager} from "../../src/interfaces/IStreamManager.sol";
import {DisputeResolver} from "../../src/DisputeResolver.sol";

/// @dev Regression tests for payouts exceeding what a stream actually consumed.
///      Both cases drain deposits belonging to *other* streams, so each test
///      funds a second stream to act as the victim pool.
contract StreamManagerSolvencyTest is BaseTest {
    uint128 constant RATE = 100;
    uint128 constant DEPOSIT = 100_000e6;

    uint256 planId;
    uint256 aliceStream;
    uint256 bobStream;

    function setUp() public override {
        super.setUp();
        usdc.mint(alice, DEPOSIT);
        usdc.mint(bob, DEPOSIT);
        planId = _createPlan(RATE, 0, 0);
        aliceStream = _approveAndCreateStream(alice, planId, DEPOSIT);
        bobStream = _approveAndCreateStream(bob, planId, DEPOSIT);
    }

    /// A cancelled stream must stop accruing at the cancellation timestamp.
    /// Otherwise the merchant claims time the subscriber was already refunded for.
    function test_cancelledStream_stopsAccruing() public {
        _advanceTime(50); // 50s * 100 = 5_000 consumed

        vm.prank(alice);
        manager.cancel(aliceStream);

        _advanceTime(1000); // time passes; cancelled stream must not accrue

        uint256 merchantBefore = usdc.balanceOf(merchant);
        vm.prank(merchant);
        manager.claim(aliceStream);

        assertEq(
            usdc.balanceOf(merchant) - merchantBefore,
            5_000,
            "merchant claimed time accrued after cancellation"
        );
    }

    /// Funds released by a dispute verdict must not remain claimable afterwards.
    function test_disputePayout_notClaimableTwice() public {
        DisputeResolver resolver = new DisputeResolver(address(manager), address(usdc));
        manager.setDisputeResolver(address(resolver));

        _advanceTime(1000); // consumed = 100_000
        uint128 frozen = 5_000;
        uint128 bond = RATE * 86400;

        vm.startPrank(alice);
        usdc.approve(address(resolver), bond);
        uint256 disputeId = resolver.openDispute(aliceStream, frozen);
        vm.stopPrank();

        vm.prank(merchant);
        resolver.respondToDispute(disputeId, keccak256("evidence"));

        uint256 merchantBefore = usdc.balanceOf(merchant);
        resolver.arbitrate(disputeId, IDisputeResolver.Verdict.Merchant);

        vm.prank(merchant);
        manager.claim(aliceStream);

        // Merchant is owed exactly what the stream consumed — the disputed
        // portion was already delivered by the verdict.
        assertEq(
            usdc.balanceOf(merchant) - merchantBefore,
            100_000,
            "disputed amount paid out twice"
        );
    }

    /// Nothing either party does may pull more out of a stream than was put in.
    function test_streamNeverPaysOutMoreThanDeposited() public {
        _advanceTime(200);

        vm.prank(merchant);
        manager.claim(aliceStream);

        _advanceTime(200);

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        manager.cancel(aliceStream);

        _advanceTime(5000);
        vm.prank(merchant);
        manager.claim(aliceStream);

        IStreamManager.Stream memory s = manager.getStream(aliceStream);
        uint256 refunded = usdc.balanceOf(alice) - aliceBefore;

        assertLe(uint256(s.claimed) + refunded, DEPOSIT, "stream paid out more than deposited");
    }
}
