/* TypeScript file generated from Entities.res by genType. */

/* eslint-disable */
/* tslint:disable */

export type id = string;

export type whereOperations<entity,fieldType> = {
  readonly eq: (_1:fieldType) => Promise<entity[]>; 
  readonly gt: (_1:fieldType) => Promise<entity[]>; 
  readonly lt: (_1:fieldType) => Promise<entity[]>
};

export type ClaimEvent_t = {
  readonly amount: string; 
  readonly blockNumber: number; 
  readonly id: id; 
  readonly merchant: string; 
  readonly stream_id: id; 
  readonly timestamp: number
};

export type ClaimEvent_indexedFieldOperations = { readonly stream_id: whereOperations<ClaimEvent_t,id> };

export type Dispute_t = {
  readonly evidenceHash: (undefined | string); 
  readonly frozenAmount: string; 
  readonly id: id; 
  readonly openedAt: number; 
  readonly settledAt: (undefined | number); 
  readonly status: string; 
  readonly stream_id: id; 
  readonly subscriber: string; 
  readonly verdict: (undefined | string)
};

export type Dispute_indexedFieldOperations = { readonly stream_id: whereOperations<Dispute_t,id> };

export type Plan_t = {
  readonly active: boolean; 
  readonly createdAt: number; 
  readonly disputePolicy: number; 
  readonly gracePeriod: number; 
  readonly id: id; 
  readonly owner: string; 
  readonly ratePerSecond: string
};

export type Plan_indexedFieldOperations = {};

export type Stream_t = {
  readonly cancelledAt: (undefined | number); 
  readonly claimed: string; 
  readonly consumed: string; 
  readonly createdAt: number; 
  readonly deposited: string; 
  readonly id: id; 
  readonly payer: string; 
  readonly plan_id: id; 
  readonly status: string
};

export type Stream_indexedFieldOperations = { readonly plan_id: whereOperations<Stream_t,id> };
