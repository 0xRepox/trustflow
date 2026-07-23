/** Minimal ABI surface — only what the agent actually calls. */

export const STREAM_MANAGER_ABI = [
  {
    type: "event",
    name: "StreamCreated",
    inputs: [
      { name: "streamId", type: "uint256", indexed: true },
      { name: "planId", type: "uint256", indexed: true },
      { name: "payer", type: "address", indexed: true },
      { name: "deposit", type: "uint128", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "function",
    name: "createStream",
    inputs: [
      { name: "planId", type: "uint256" },
      { name: "depositAmount", type: "uint128" },
    ],
    outputs: [{ name: "streamId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "topUp",
    inputs: [
      { name: "streamId", type: "uint256" },
      { name: "amount", type: "uint128" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancel",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getBalance",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [
      { name: "usable", type: "uint256" },
      { name: "consumed", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getStream",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "planId", type: "uint256" },
          { name: "payer", type: "address" },
          { name: "deposited", type: "uint128" },
          { name: "consumed", type: "uint128" },
          { name: "claimed", type: "uint128" },
          { name: "frozen", type: "uint128" },
          { name: "ratePerSecond", type: "uint128" },
          { name: "startTimestamp", type: "uint64" },
          { name: "lastClaimTimestamp", type: "uint64" },
          { name: "cancelledAt", type: "uint64" },
          { name: "pausedAt", type: "uint64" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

export const PLAN_REGISTRY_ABI = [
  {
    type: "function",
    name: "getPlan",
    inputs: [{ name: "planId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "ratePerSecond", type: "uint128" },
          { name: "gracePeriod", type: "uint32" },
          { name: "disputePolicy", type: "uint8" },
          { name: "active", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

export const DISPUTE_RESOLVER_ABI = [
  {
    type: "function",
    name: "openDispute",
    inputs: [
      { name: "streamId", type: "uint256" },
      { name: "amount", type: "uint128" },
    ],
    outputs: [{ name: "disputeId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

/** Mirrors IStreamManager.StreamStatus. */
export const StreamStatus = {
  Active: 0,
  Paused: 1,
  Cancelled: 2,
} as const;
