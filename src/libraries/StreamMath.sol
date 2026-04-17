// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

library StreamMath {
    function computeConsumed(uint128 ratePerSecond, uint64 startTs, uint64 nowTs, uint128 deposited)
        internal
        pure
        returns (uint256 consumed, uint256 remaining)
    {
        if (nowTs <= startTs || ratePerSecond == 0) {
            return (0, deposited);
        }
        uint256 elapsed = uint256(nowTs - startTs);
        uint256 raw = elapsed * uint256(ratePerSecond);
        consumed = Math.min(raw, deposited);
        remaining = deposited - consumed;
    }
}
