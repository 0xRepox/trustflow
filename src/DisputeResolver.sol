// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IDisputeResolver} from "./interfaces/IDisputeResolver.sol";
import {IStreamManager} from "./interfaces/IStreamManager.sol";
import {IPlanRegistry} from "./interfaces/IPlanRegistry.sol";
import {Errors} from "./libraries/Errors.sol";

interface IStreamManagerExtended is IStreamManager {
    function freezeForDispute(uint256 streamId, uint128 amount) external;
    function resolveDispute(uint256 streamId, uint128 amount, uint128 toSubscriber, uint128 toMerchant) external;
    function registry() external view returns (IPlanRegistry);
}

contract DisputeResolver is IDisputeResolver, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IStreamManagerExtended public immutable streamManager;
    IERC20 public immutable usdc;
    address public immutable arbitrator;

    uint64 public constant RESPOND_WINDOW = 7 * 86400;

    mapping(uint256 => Dispute) private _disputes;
    uint256 public nextDisputeId = 1;

    constructor(address _streamManager, address _usdc) {
        streamManager = IStreamManagerExtended(_streamManager);
        usdc = IERC20(_usdc);
        arbitrator = msg.sender;
    }

    function openDispute(uint256 streamId, uint128 amount) external nonReentrant returns (uint256 disputeId) {
        if (amount == 0) revert Errors.ZeroDisputeAmount();

        IStreamManager.Stream memory stream = streamManager.getStream(streamId);
        if (stream.payer != msg.sender) revert Errors.NotDisputeSubscriber();

        IPlanRegistry.Plan memory plan = streamManager.registry().getPlan(stream.planId);
        address merchantAddr = plan.owner;

        uint128 bond = plan.ratePerSecond * 86400;

        // Pull bond from subscriber
        usdc.safeTransferFrom(msg.sender, address(this), bond);

        // Freeze the disputed amount in StreamManager (will revert if amount > available)
        streamManager.freezeForDispute(streamId, amount);

        disputeId = nextDisputeId++;
        _disputes[disputeId] = Dispute({
            streamId: streamId,
            subscriber: msg.sender,
            merchant: merchantAddr,
            frozenAmount: amount,
            bond: bond,
            openedAt: uint64(block.timestamp),
            respondDeadline: uint64(block.timestamp) + RESPOND_WINDOW,
            evidenceHash: bytes32(0),
            status: DisputeStatus.Open,
            verdict: Verdict.Pending
        });

        emit DisputeOpened(disputeId, streamId, msg.sender, amount);
    }

    function respondToDispute(uint256 disputeId, bytes32 evidenceHash) external nonReentrant {
        Dispute storage d = _disputes[disputeId];
        if (d.status == DisputeStatus.Settled) revert Errors.DisputeAlreadySettled();
        if (d.status == DisputeStatus.Responded) revert Errors.DisputeAlreadyResponded();
        if (msg.sender != d.merchant) revert Errors.NotDisputeMerchant();
        if (block.timestamp > d.respondDeadline) revert Errors.RespondWindowExpired();

        d.evidenceHash = evidenceHash;
        d.status = DisputeStatus.Responded;

        emit DisputeResponded(disputeId, evidenceHash);
    }

    function arbitrate(uint256 disputeId, Verdict verdict) external nonReentrant {
        if (msg.sender != arbitrator) revert Errors.NotArbitrator();
        Dispute storage d = _disputes[disputeId];
        if (d.status == DisputeStatus.Settled) revert Errors.DisputeAlreadySettled();

        _settle(disputeId, d, verdict);
    }

    function defaultSettle(uint256 disputeId) external nonReentrant {
        Dispute storage d = _disputes[disputeId];
        if (d.status == DisputeStatus.Settled) revert Errors.DisputeAlreadySettled();
        if (d.status == DisputeStatus.Responded) revert Errors.DisputeAlreadyResponded();
        if (block.timestamp <= d.respondDeadline) revert Errors.RespondWindowActive();

        // No response within deadline → pro-merchant
        _settle(disputeId, d, Verdict.Merchant);
    }

    function getDispute(uint256 disputeId) external view returns (Dispute memory) {
        return _disputes[disputeId];
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _settle(uint256 disputeId, Dispute storage d, Verdict verdict) internal {
        d.status = DisputeStatus.Settled;
        d.verdict = verdict;

        uint128 toSubscriber;
        uint128 toMerchant;

        if (verdict == Verdict.Subscriber) {
            toSubscriber = d.frozenAmount;
            toMerchant = 0;
        } else if (verdict == Verdict.Merchant) {
            toSubscriber = 0;
            toMerchant = d.frozenAmount;
        } else {
            // Split 50/50
            toSubscriber = d.frozenAmount / 2;
            toMerchant = d.frozenAmount - toSubscriber;
        }

        // Emit before transfers so event is first in log
        emit DisputeSettled(disputeId, verdict, toSubscriber, toMerchant);

        // Resolve frozen amount — StreamManager transfers to subscriber and merchant directly
        streamManager.resolveDispute(d.streamId, d.frozenAmount, toSubscriber, toMerchant);

        // Return bond to subscriber
        usdc.safeTransfer(d.subscriber, d.bond);
    }
}
