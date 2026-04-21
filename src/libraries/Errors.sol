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
    // Dispute errors
    error NotDisputeSubscriber();
    error NotDisputeMerchant();
    error NotArbitrator();
    error DisputeAlreadyExists();
    error DisputeNotOpen();
    error DisputeAlreadyResponded();
    error DisputeAlreadySettled();
    error RespondWindowExpired();
    error RespondWindowActive();
    error DisputeAmountTooLarge();
    error ZeroDisputeAmount();
    error DisputeResolverNotSet();
    error NotDisputeResolver();
    error ZeroAddress();
    error StreamHasActiveDispute();
}
