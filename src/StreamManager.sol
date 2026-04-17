// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStreamManager} from "./interfaces/IStreamManager.sol";
import {IPlanRegistry} from "./interfaces/IPlanRegistry.sol";
import {StreamMath} from "./libraries/StreamMath.sol";
import {Errors} from "./libraries/Errors.sol";
import {ISignatureTransfer} from "permit2/interfaces/ISignatureTransfer.sol";

contract StreamManager is IStreamManager, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IPlanRegistry public immutable registry;
    address public immutable permit2;
    address public disputeResolver;

    uint256 public constant DAILY_CAP_MULTIPLIER = 2;

    mapping(uint256 => Stream) private _streams;
    mapping(address => uint256[]) private _payerStreams;
    uint256 public nextStreamId = 1;

    // Tracks how much was claimed within a rolling 24h window per stream
    mapping(uint256 => uint256) private _lastClaimWindowStart;
    mapping(uint256 => uint128) private _claimedInWindow;

    modifier onlyDisputeResolver() {
        if (msg.sender != disputeResolver) revert Errors.NotDisputeResolver();
        _;
    }

    constructor(address _usdc, address _registry, address _permit2) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        registry = IPlanRegistry(_registry);
        permit2 = _permit2;
    }

    function setDisputeResolver(address _disputeResolver) external onlyOwner {
        disputeResolver = _disputeResolver;
    }

    function createStream(uint256 planId, uint128 depositAmount) external nonReentrant returns (uint256 streamId) {
        if (depositAmount == 0) revert Errors.ZeroDeposit();
        IPlanRegistry.Plan memory plan = registry.getPlan(planId);
        if (!plan.active) revert Errors.PlanNotActive();
        if (depositAmount < plan.ratePerSecond) revert Errors.DepositTooSmall();

        usdc.safeTransferFrom(msg.sender, address(this), depositAmount);

        streamId = nextStreamId++;
        _streams[streamId] = Stream({
            planId: planId,
            payer: msg.sender,
            deposited: depositAmount,
            consumed: 0,
            claimed: 0,
            frozen: 0,
            startTimestamp: uint64(block.timestamp),
            lastClaimTimestamp: uint64(block.timestamp),
            cancelledAt: 0,
            pausedAt: 0,
            status: StreamStatus.Active
        });
        _payerStreams[msg.sender].push(streamId);

        emit StreamCreated(streamId, planId, msg.sender, depositAmount);
    }

    function createStreamWithPermit2(
        uint256 planId,
        uint128 depositAmount,
        bytes calldata permitTransferFrom,
        bytes calldata sig
    ) external nonReentrant returns (uint256 streamId) {
        // Permit2 integration — decode and use ISignatureTransfer
        if (depositAmount == 0) revert Errors.ZeroDeposit();
        IPlanRegistry.Plan memory plan = registry.getPlan(planId);
        if (!plan.active) revert Errors.PlanNotActive();
        if (depositAmount < plan.ratePerSecond) revert Errors.DepositTooSmall();

        _permit2Transfer(msg.sender, depositAmount, permitTransferFrom, sig);

        streamId = nextStreamId++;
        _streams[streamId] = Stream({
            planId: planId,
            payer: msg.sender,
            deposited: depositAmount,
            consumed: 0,
            claimed: 0,
            frozen: 0,
            startTimestamp: uint64(block.timestamp),
            lastClaimTimestamp: uint64(block.timestamp),
            cancelledAt: 0,
            pausedAt: 0,
            status: StreamStatus.Active
        });
        _payerStreams[msg.sender].push(streamId);

        emit StreamCreated(streamId, planId, msg.sender, depositAmount);
    }

    function cancel(uint256 streamId) external nonReentrant {
        Stream storage stream = _streams[streamId];
        if (stream.payer == address(0)) revert Errors.InvalidStream();
        if (stream.payer != msg.sender) revert Errors.NotStreamPayer();
        if (stream.status == StreamStatus.Cancelled) revert Errors.StreamNotActive();

        (uint256 consumed,) = _computeConsumed(streamId);
        uint128 consumed128 = uint128(consumed);
        uint128 refund = stream.deposited - consumed128;

        stream.consumed = consumed128;
        stream.status = StreamStatus.Cancelled;
        stream.cancelledAt = uint64(block.timestamp);

        if (refund > 0) {
            _safeTransferOrSkip(stream.payer, refund);
        }

        emit StreamCancelled(streamId, refund, consumed128);
    }

    function claim(uint256 streamId) external nonReentrant {
        Stream storage stream = _streams[streamId];
        if (stream.planId == 0) revert Errors.InvalidStream();
        if (stream.status == StreamStatus.Paused) revert Errors.StreamPaused();

        IPlanRegistry.Plan memory plan = registry.getPlan(stream.planId);
        if (plan.owner != msg.sender) revert Errors.NotPlanMerchant();

        (uint256 consumed,) = _computeConsumed(streamId);
        uint128 consumed128 = uint128(consumed);
        uint128 claimable = consumed128 - stream.claimed - stream.frozen;

        if (claimable == 0) return;

        // Apply daily cap: clamps claimable to remaining window allowance; reverts if window exhausted
        uint128 dailyCap = uint128(plan.ratePerSecond * 86400 * DAILY_CAP_MULTIPLIER);
        claimable = _applyDailyCap(streamId, claimable, dailyCap);

        stream.claimed += claimable;
        stream.consumed = consumed128;
        stream.lastClaimTimestamp = uint64(block.timestamp);

        bool ok = _safeTransferOrPause(streamId, msg.sender, claimable);
        if (ok) {
            emit Claimed(streamId, msg.sender, claimable);
        }
    }

    function topUp(uint256 streamId, uint128 amount) external nonReentrant {
        Stream storage stream = _streams[streamId];
        if (stream.payer == address(0)) revert Errors.InvalidStream();
        if (stream.payer != msg.sender) revert Errors.NotStreamPayer();
        if (stream.status == StreamStatus.Cancelled) revert Errors.StreamNotActive();
        if (amount == 0) revert Errors.ZeroDeposit();

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        stream.deposited += amount;

        emit StreamToppedUp(streamId, amount);
    }

    function resumeClaim(uint256 streamId) external nonReentrant {
        Stream storage stream = _streams[streamId];
        if (stream.planId == 0) revert Errors.InvalidStream();
        if (stream.status != StreamStatus.Paused) revert Errors.StreamNotActive();

        IPlanRegistry.Plan memory plan = registry.getPlan(stream.planId);
        if (plan.owner != msg.sender) revert Errors.NotPlanMerchant();

        // Shift startTimestamp forward by pause duration so consumed time doesn't include pause
        uint64 pauseDuration = uint64(block.timestamp) - stream.pausedAt;
        stream.startTimestamp += pauseDuration;
        stream.pausedAt = 0;
        stream.status = StreamStatus.Active;

        emit StreamResumed(streamId);

        // Attempt immediate claim of any accrued (should be 0 since paused, but handle resume)
        (uint256 consumed,) = _computeConsumed(streamId);
        uint128 consumed128 = uint128(consumed);
        uint128 claimable = consumed128 - stream.claimed;
        if (claimable > 0) {
            uint128 dailyCap = uint128(plan.ratePerSecond * 86400 * DAILY_CAP_MULTIPLIER);
            claimable = _applyDailyCap(streamId, claimable, dailyCap);

            stream.claimed += claimable;
            stream.consumed = consumed128;
            stream.lastClaimTimestamp = uint64(block.timestamp);

            bool ok = _safeTransferOrPause(streamId, msg.sender, claimable);
            if (ok) {
                emit Claimed(streamId, msg.sender, claimable);
            }
        }
    }

    function freezeForDispute(uint256 streamId, uint128 amount) external onlyDisputeResolver {
        Stream storage stream = _streams[streamId];
        if (stream.payer == address(0)) revert Errors.InvalidStream();
        (uint256 consumed,) = _computeConsumed(streamId);
        uint128 available = uint128(consumed) - stream.claimed - stream.frozen;
        if (amount > available) revert Errors.DisputeAmountTooLarge();
        stream.frozen += amount;
    }

    function resolveDispute(uint256 streamId, uint128 amount, uint128 toSubscriber, uint128 toMerchant)
        external
        onlyDisputeResolver
    {
        Stream storage stream = _streams[streamId];
        if (stream.payer == address(0)) revert Errors.InvalidStream();
        stream.frozen -= amount;
        if (toSubscriber > 0) {
            _safeTransferOrSkip(stream.payer, toSubscriber);
        }
        if (toMerchant > 0) {
            address merchantAddr = registry.getPlan(stream.planId).owner;
            _safeTransferOrSkip(merchantAddr, toMerchant);
        }
    }

    function getStream(uint256 streamId) external view returns (Stream memory) {
        return _streams[streamId];
    }

    function getBalance(uint256 streamId) external view returns (uint256 usable, uint256 consumed) {
        Stream storage stream = _streams[streamId];
        (consumed,) = _computeConsumed(streamId);
        usable = stream.deposited > consumed ? stream.deposited - consumed : 0;
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _computeConsumed(uint256 streamId) internal view returns (uint256 consumed, uint256 remaining) {
        Stream storage stream = _streams[streamId];
        uint64 effectiveNow = stream.status == StreamStatus.Paused ? stream.pausedAt : uint64(block.timestamp);
        return StreamMath.computeConsumed(
            registry.getPlan(stream.planId).ratePerSecond,
            stream.startTimestamp,
            effectiveNow,
            stream.deposited
        );
    }

    function _safeTransferOrPause(uint256 streamId, address to, uint128 amount) internal returns (bool) {
        (bool ok,) = address(usdc).call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        if (!ok) {
            _streams[streamId].status = StreamStatus.Paused;
            _streams[streamId].pausedAt = uint64(block.timestamp);
            emit StreamPaused(streamId);
        }
        return ok;
    }

    function _safeTransferOrSkip(address to, uint128 amount) internal {
        // Intentionally ignore return value — payer refund on cancel; best-effort
        (bool ok,) = address(usdc).call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        ok; // silence unused var
    }

    function _applyDailyCap(uint256 streamId, uint128 claimable, uint128 dailyCap)
        internal
        returns (uint128 capped)
    {
        uint256 windowStart = _lastClaimWindowStart[streamId];
        if (block.timestamp >= windowStart + 86400) {
            _lastClaimWindowStart[streamId] = block.timestamp;
            _claimedInWindow[streamId] = 0;
        }
        uint128 used = _claimedInWindow[streamId];
        if (used >= dailyCap) revert Errors.ClaimCapExceeded();
        uint128 remaining = dailyCap - used;
        capped = claimable > remaining ? remaining : claimable;
        _claimedInWindow[streamId] = used + capped;
    }

    function _permit2Transfer(address from, uint128 amount, bytes calldata permitData, bytes calldata sig) internal {
        ISignatureTransfer.PermitTransferFrom memory permit =
            abi.decode(permitData, (ISignatureTransfer.PermitTransferFrom));
        ISignatureTransfer.SignatureTransferDetails memory details =
            ISignatureTransfer.SignatureTransferDetails({to: address(this), requestedAmount: amount});
        ISignatureTransfer(permit2).permitTransferFrom(permit, details, from, sig);
    }
}
