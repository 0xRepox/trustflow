import type { Hash } from "viem";

interface MinimalPublicClient {
  waitForTransactionReceipt(args: { hash: Hash }): Promise<unknown>;
}

/**
 * `writeContractAsync` resolves once a transaction is submitted, not once it's
 * mined — refetching the indexer right after it returns catches neither the
 * still-pending transaction nor the indexer's own catch-up window, so the new
 * state silently doesn't show up until something else happens to trigger a
 * later refetch (a page reload). Wait for the receipt, then poll the indexer
 * until the change is actually visible or attempts run out.
 */
export async function waitForIndexerUpdate<T>(
  publicClient: MinimalPublicClient,
  hash: Hash,
  refetch: () => Promise<{ data?: T }>,
  isUpdated: (data: T | undefined) => boolean,
  options?: { maxAttempts?: number; delayMs?: number },
): Promise<T | undefined> {
  await publicClient.waitForTransactionReceipt({ hash });

  const maxAttempts = options?.maxAttempts ?? 8;
  const delayMs = options?.delayMs ?? 1_500;

  let data: T | undefined;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await refetch();
    data = result.data;
    if (isUpdated(data)) return data;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  // Give up quietly — the transaction succeeded on-chain regardless; the
  // indexer will catch up on its own next poll even if the UI didn't wait for it.
  return data;
}
