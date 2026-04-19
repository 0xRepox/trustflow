const INDEXER_URL =
  process.env.NEXT_PUBLIC_ENVIO_URL ?? "http://localhost:42069/graphql";

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(INDEXER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

export interface Plan {
  id: string;
  owner: string;
  ratePerSecond: string;
  gracePeriod: number;
  disputePolicy: number;
  active: boolean;
  createdAt: number;
}

export interface Stream {
  id: string;
  planId: string;
  payer: string;
  deposited: string;
  claimed: string;
  consumed: string;
  status: string;
  createdAt: number;
  cancelledAt?: number;
}

export interface Dispute {
  id: string;
  streamId: string;
  subscriber: string;
  frozenAmount: string;
  status: string;
  verdict?: string;
  evidenceHash?: string;
  openedAt: number;
  settledAt?: number;
}

export interface ClaimEvent {
  id: string;
  streamId: string;
  merchant: string;
  amount: string;
  timestamp: number;
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const data = await gql<{ plan: Plan | null }>(
    `query($id: String!) { plan(id: $id) { id owner ratePerSecond gracePeriod disputePolicy active createdAt } }`,
    { id }
  );
  return data.plan;
}

export async function getPlansByOwner(owner: string): Promise<Plan[]> {
  const data = await gql<{ plans: { items: Plan[] } }>(
    `query($owner: String!) {
      plans(where: { owner: $owner }, limit: 100) {
        items { id owner ratePerSecond gracePeriod disputePolicy active createdAt }
      }
    }`,
    { owner: owner.toLowerCase() }
  );
  return data.plans.items;
}

export async function getStreamsByPlanIds(planIds: string[]): Promise<Stream[]> {
  if (planIds.length === 0) return [];
  const results = await Promise.all(
    planIds.map((planId) =>
      gql<{ streams: { items: Stream[] } }>(
        `query($planId: String!) {
          streams(where: { planId: $planId }, limit: 100) {
            items { id planId payer deposited claimed consumed status createdAt cancelledAt }
          }
        }`,
        { planId }
      )
    )
  );
  return results.flatMap((r) => r.streams.items);
}

export async function getDisputesByMerchant(streamIds: string[]): Promise<Dispute[]> {
  if (streamIds.length === 0) return [];
  const results = await Promise.all(
    streamIds.map((streamId) =>
      gql<{ disputes: { items: Dispute[] } }>(
        `query($streamId: String!) {
          disputes(where: { streamId: $streamId }, limit: 100) {
            items { id streamId subscriber frozenAmount status verdict evidenceHash openedAt settledAt }
          }
        }`,
        { streamId }
      )
    )
  );
  return results.flatMap((r) => r.disputes.items);
}
