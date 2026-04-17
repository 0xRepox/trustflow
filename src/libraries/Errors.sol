// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Errors {
    error NotPlanOwner();
    error PlanNotActive();
    error StreamNotActive();
    error StreamPaused();
    error InsufficientBalance();
    error ZeroRate();
    error ZeroDeposit();
    error ClaimCapExceeded();
    error NotStreamPayer();
    error NotPlanMerchant();
    error DepositTooSmall();
    error InvalidStream();
}
