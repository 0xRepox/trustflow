import { type Address } from "viem";

export const ADDRESSES = {
  PlanRegistry: "0x276Ad3A0c2A96d2C135736c6Bde315Ff7d9F6648" as Address,
  StreamManager: "0xb4cC364d19eb4473852316Ec7B8bcc6D87EF3954" as Address,
  DisputeResolver: "0xc2fd9616d9d8Af35a6D89290bed4838Da3F5083d" as Address,
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
] as const;

export const DISPUTE_RESOLVER_ABI = [
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
