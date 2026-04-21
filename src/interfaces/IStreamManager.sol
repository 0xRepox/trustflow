// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStreamManager {
    enum StreamStatus {
        Active,
        Paused,
        Cancelled
    }

    struct Stream {
        uint256 planId;
        address payer;
        uint128 deposited;
        uint128 consumed;
        uint128 claimed;
        uint128 frozen;
        uint128 ratePerSecond;
        uint64 startTimestamp;
        uint64 lastClaimTimestamp;
        uint64 cancelledAt;
        uint64 pausedAt;
        StreamStatus status;
    }

    event StreamCreated(uint256 indexed streamId, uint256 indexed planId, address indexed payer, uint128 deposit);
    event StreamCancelled(uint256 indexed streamId, uint128 refund, uint128 consumed);
    event StreamToppedUp(uint256 indexed streamId, uint128 amount);
    event StreamPaused(uint256 indexed streamId);
    event StreamResumed(uint256 indexed streamId);
    event Claimed(uint256 indexed streamId, address indexed merchant, uint128 amount);
    event DisputeResolverUpdated(address indexed oldResolver, address indexed newResolver);

    function createStream(uint256 planId, uint128 depositAmount) external returns (uint256 streamId);

    function createStreamWithPermit2(
        uint256 planId,
        uint128 depositAmount,
        bytes calldata permitTransferFrom,
        bytes calldata sig
    ) external returns (uint256 streamId);

    function cancel(uint256 streamId) external;

    function claim(uint256 streamId) external;

    function topUp(uint256 streamId, uint128 amount) external;

    function resumeClaim(uint256 streamId) external;

    function getStream(uint256 streamId) external view returns (Stream memory);

    function getBalance(uint256 streamId) external view returns (uint256 usable, uint256 consumed);
}
