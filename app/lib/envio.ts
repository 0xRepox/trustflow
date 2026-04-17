const ENVIO_URL =
  process.env.NEXT_PUBLIC_ENVIO_URL ?? "http://localhost:8080/v1/graphql";

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENVIO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 10 },
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
  plan: { id: string };
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
  stream: { id: string };
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
  stream: { id: string };
  merchant: string;
  amount: string;
  timestamp: number;
}

export async function getPlansByOwner(owner: string): Promise<Plan[]> {
  const data = await gql<{ Plan: Plan[] }>(
    `query($owner: String!) { Plan(where: { owner: { _eq: $owner } }) {
      id owner ratePerSecond gracePeriod disputePolicy active createdAt
    }}`,
    { owner: owner.toLowerCase() }
  );
  return data.Plan;
}

export async function getStreamsByPlanIds(planIds: string[]): Promise<Stream[]> {
  if (planIds.length === 0) return [];
  const data = await gql<{ Stream: Stream[] }>(
    `query($ids: [String!]!) { Stream(where: { plan_id: { _in: $ids } }) {
      id plan { id } payer deposited claimed consumed status createdAt cancelledAt
    }}`,
    { ids: planIds }
  );
  return data.Stream;
}

export async function getDisputesByMerchant(merchant: string): Promise<Dispute[]> {
  const data = await gql<{ Dispute: Dispute[] }>(
    `query($merchant: String!) {
      Dispute(where: { stream: { plan: { owner: { _eq: $merchant } } } }) {
        id stream { id } subscriber frozenAmount status verdict evidenceHash openedAt settledAt
      }
    }`,
    { merchant: merchant.toLowerCase() }
  );
  return data.Dispute;
}
