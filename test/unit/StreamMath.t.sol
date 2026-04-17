// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StreamMath} from "../../src/libraries/StreamMath.sol";

contract StreamMathTest is Test {
    function test_zeroElapsed_returnsZeroConsumed() public pure {
        uint64 ts = 1_000_000;
        (uint256 consumed, uint256 remaining) = StreamMath.computeConsumed(10, ts, ts, 1000e6);
        assertEq(consumed, 0);
        assertEq(remaining, 1000e6);
    }

    function test_linearConsumption() public pure {
        uint128 rate = 11; // ~$30/mo in wei-USDC/sec
        uint64 start = 1_000_000;
        uint64 now_ = start + 100;
        uint128 deposited = 10_000;

        (uint256 consumed, uint256 remaining) = StreamMath.computeConsumed(rate, start, now_, deposited);
        assertEq(consumed, 1100);
        assertEq(remaining, 8900);
    }

    function test_clampedAtDeposit() public pure {
        uint128 rate = 1000;
        uint64 start = 0;
        uint64 now_ = 1000; // would be 1_000_000 consumed, but deposited is 500
        uint128 deposited = 500;

        (uint256 consumed, uint256 remaining) = StreamMath.computeConsumed(rate, start, now_, deposited);
        assertEq(consumed, 500);
        assertEq(remaining, 0);
    }

    function test_fullDepositConsumed() public pure {
        uint128 rate = 10;
        uint64 start = 0;
        uint64 now_ = 100;
        uint128 deposited = 1000;

        (uint256 consumed, uint256 remaining) = StreamMath.computeConsumed(rate, start, now_, deposited);
        assertEq(consumed, 1000);
        assertEq(remaining, 0);
    }

    function test_consumedPlusRemainingEqualsDeposited(
        uint128 rate,
        uint64 start,
        uint64 elapsed,
        uint128 deposited
    ) public pure {
        vm.assume(rate > 0);
        vm.assume(deposited > 0);
        vm.assume(uint256(start) + uint256(elapsed) <= type(uint64).max);
        uint64 now_ = start + elapsed;

        (uint256 consumed, uint256 remaining) = StreamMath.computeConsumed(rate, start, now_, deposited);
        assertEq(consumed + remaining, deposited);
    }

    function test_consumedNeverExceedsDeposited(
        uint128 rate,
        uint64 start,
        uint64 elapsed,
        uint128 deposited
    ) public pure {
        vm.assume(rate > 0);
        vm.assume(deposited > 0);
        vm.assume(uint256(start) + uint256(elapsed) <= type(uint64).max);
        uint64 now_ = start + elapsed;

        (uint256 consumed,) = StreamMath.computeConsumed(rate, start, now_, deposited);
        assertLe(consumed, deposited);
    }

    function test_zeroRate_returnsZeroConsumed() public pure {
        (uint256 consumed, uint256 remaining) = StreamMath.computeConsumed(0, 100, 200, 1000);
        assertEq(consumed, 0);
        assertEq(remaining, 1000);
    }
}
