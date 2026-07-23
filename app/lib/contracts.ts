import { type Address } from "viem";

export const ADDRESSES = {
  PlanRegistry: "0xe1deB4a0504f2Baf27D2C225B3807a5743113A73" as Address,
  StreamManager: "0xf576f7aF812298B95bB440d6718A8b1d96d54395" as Address,
  DisputeResolver: "0xF87B65f0bFe749b0BDd0834D3a808B04c241714F" as Address,
  USDC: "0x3600000000000000000000000000000000000000" as Address,
} as const;

export const PLAN_REGISTRY_ABI = [
  {
    type: "function",
    name: "createPlan",
    inputs: [
      { name: "ratePerSecond", type: "uint128" },
      { name: "gracePeriod", type: "uint32" },
      { name: "disputePolicy", type: "uint8" },
    ],
    outputs: [{ name: "planId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updatePlan",
    inputs: [
      { name: "planId", type: "uint256" },
      { name: "ratePerSecond", type: "uint128" },
      { name: "gracePeriod", type: "uint32" },
      { name: "disputePolicy", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivatePlan",
    inputs: [{ name: "planId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const STREAM_MANAGER_ABI = [
  {
    type: "function",
    name: "claim",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createStream",
    inputs: [
      { name: "planId", type: "uint256" },
      { name: "deposit", type: "uint128" },
    ],
    outputs: [{ name: "streamId", type: "uint256" }],
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
    name: "getBalance",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [
      { name: "usable", type: "uint256" },
      { name: "consumed", type: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;

export const USDC_ABI = [
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
  {
    type: "function",
    name: "respondToDispute",
    inputs: [
      { name: "disputeId", type: "uint256" },
      { name: "evidenceHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "defaultSettle",
    inputs: [{ name: "disputeId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "arbitrate",
    inputs: [
      { name: "disputeId", type: "uint256" },
      { name: "verdict", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
