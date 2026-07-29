import { BaseError } from "viem";
import { TransactionRevertedError } from "./waitForIndexer";

/**
 * viem's `.message` on a wallet/contract error includes the full call dump —
 * chain, addresses, calldata, docs link, viem version — meant for developer
 * logs, not a toast. `.shortMessage` is the same error decoded down to just
 * the human-relevant line (e.g. "User rejected the request." instead of a
 * multi-paragraph blob), including decoded custom revert reasons.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TransactionRevertedError) {
    return "Transaction reverted onchain — nothing was transferred.";
  }
  if (error instanceof BaseError) {
    return FRIENDLY_REVERTS[error.shortMessage] ?? error.shortMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Transaction failed";
}

/** Known custom-error shortMessages worth a plainer explanation than viem's default decode. */
const FRIENDLY_REVERTS: Record<string, string> = {
  'The contract function "claim" reverted with the following reason:\nClaimCapExceeded()':
    "Daily claim limit reached for this stream — the rest becomes claimable as the window rolls over.",
};
