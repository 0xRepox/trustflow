// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDisputeResolver {
    enum DisputeStatus {
        Open,
        Responded,
        Settled
    }

    enum Verdict {
        Pending,
        Subscriber,
        Merchant,
        Split
    }

    struct Dispute {
        uint256 streamId;
        address subscriber;
        address merchant;
        uint128 frozenAmount;
        uint128 bond;
        uint64 openedAt;
        uint64 respondDeadline;
        bytes32 evidenceHash;
        DisputeStatus status;
        Verdict verdict;
    }

    event DisputeOpened(uint256 indexed disputeId, uint256 indexed streamId, address indexed subscriber, uint128 frozenAmount);
    event DisputeResponded(uint256 indexed disputeId, bytes32 evidenceHash);
    event DisputeSettled(uint256 indexed disputeId, Verdict verdict, uint128 toSubscriber, uint128 toMerchant);

    function openDispute(uint256 streamId, uint128 amount) external returns (uint256 disputeId);
    function respondToDispute(uint256 disputeId, bytes32 evidenceHash) external;
    function arbitrate(uint256 disputeId, Verdict verdict) external;
    function defaultSettle(uint256 disputeId) external;
    function getDispute(uint256 disputeId) external view returns (Dispute memory);
}
