const INDEXER_URL =
  process.env.NEXT_PUBLIC_INDEXER_URL ?? "http://localhost:42069/graphql";

export class IndexerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IndexerError";
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(INDEXER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
  } catch {
    throw new IndexerError("Cannot reach the indexer. It may be offline.");
  }

  // A dead or misrouted host answers with non-GraphQL JSON (or HTML), which has
  // no `errors` key — without this check that body sails through as undefined.
  if (!res.ok) {
    throw new IndexerError(`Indexer returned HTTP ${res.status}. It may be offline or still syncing.`);
  }

  let json: GraphQLResponse<T>;
  try {
    json = (await res.json()) as GraphQLResponse<T>;
  } catch {
    throw new IndexerError("Indexer returned a malformed response.");
  }

  if (json.errors?.length) throw new IndexerError(json.errors[0].message);
  if (json.data === undefined || json.data === null) {
    throw new IndexerError("Indexer returned no data.");
  }

  return json.data;
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

export async function getStreamsByPayer(payerAddress: string): Promise<Stream[]> {
  const data = await gql<{ streams: { items: Stream[] } }>(
    `query($payer: String!) {
      streams(where: { payer: $payer }, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
        items { id planId payer deposited claimed consumed status createdAt cancelledAt }
      }
    }`,
    { payer: payerAddress.toLowerCase() }
  );
  return data.streams.items;
}

export async function getActiveStream(planId: string, payerAddress: string): Promise<Stream | null> {
  const data = await gql<{ streams: { items: Stream[] } }>(
    `query($planId: String!, $payer: String!) {
      streams(where: { planId: $planId, payer: $payer, status: "Active" }, limit: 1) {
        items { id planId payer deposited claimed consumed status createdAt cancelledAt }
      }
    }`,
    { planId, payer: payerAddress.toLowerCase() }
  );
  return data.streams.items[0] ?? null;
}

// Finds an active stream this payer already has on any OTHER plan from the
// same merchant — used to block buying a second concurrent plan from one
// merchant and to drive the upgrade/downgrade switch flow instead.
export async function getActiveStreamWithMerchant(
  merchantOwner: string,
  payerAddress: string,
  excludePlanId: string
): Promise<Stream | null> {
  const plans = await getPlansByOwner(merchantOwner);
  const otherPlanIds = plans.map((p) => p.id).filter((id) => id !== excludePlanId);
  if (otherPlanIds.length === 0) return null;

  const streams = await Promise.all(
    otherPlanIds.map((planId) => getActiveStream(planId, payerAddress))
  );
  return streams.find((s): s is Stream => s !== null) ?? null;
}

export async function getDisputesBySubscriber(subscriberAddress: string): Promise<Dispute[]> {
  const data = await gql<{ disputes: { items: Dispute[] } }>(
    `query($subscriber: String!) {
      disputes(where: { subscriber: $subscriber }, limit: 100) {
        items { id streamId subscriber frozenAmount status verdict evidenceHash openedAt settledAt }
      }
    }`,
    { subscriber: subscriberAddress.toLowerCase() }
  );
  return data.disputes.items;
}

export async function getClaimEventsByStreamIds(streamIds: string[]): Promise<ClaimEvent[]> {
  if (streamIds.length === 0) return [];
  const results = await Promise.all(
    streamIds.map((streamId) =>
      gql<{ claimEvents: { items: ClaimEvent[] } }>(
        `query($streamId: String!) {
          claimEvents(where: { streamId: $streamId }, orderBy: "timestamp", orderDirection: "asc", limit: 1000) {
            items { id streamId merchant amount timestamp }
          }
        }`,
        { streamId }
      )
    )
  );
  return results.flatMap((r) => r.claimEvents.items);
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
