/* TypeScript file generated from TestHelpers.res by genType. */

/* eslint-disable */
/* tslint:disable */

const TestHelpersJS = require('./TestHelpers.res.js');

import type {DisputeResolver_DisputeOpened_event as Types_DisputeResolver_DisputeOpened_event} from './Types.gen';

import type {DisputeResolver_DisputeResponded_event as Types_DisputeResolver_DisputeResponded_event} from './Types.gen';

import type {DisputeResolver_DisputeSettled_event as Types_DisputeResolver_DisputeSettled_event} from './Types.gen';

import type {PlanRegistry_PlanCreated_event as Types_PlanRegistry_PlanCreated_event} from './Types.gen';

import type {PlanRegistry_PlanDeactivated_event as Types_PlanRegistry_PlanDeactivated_event} from './Types.gen';

import type {PlanRegistry_PlanUpdated_event as Types_PlanRegistry_PlanUpdated_event} from './Types.gen';

import type {StreamManager_Claimed_event as Types_StreamManager_Claimed_event} from './Types.gen';

import type {StreamManager_StreamCancelled_event as Types_StreamManager_StreamCancelled_event} from './Types.gen';

import type {StreamManager_StreamCreated_event as Types_StreamManager_StreamCreated_event} from './Types.gen';

import type {StreamManager_StreamPaused_event as Types_StreamManager_StreamPaused_event} from './Types.gen';

import type {StreamManager_StreamResumed_event as Types_StreamManager_StreamResumed_event} from './Types.gen';

import type {StreamManager_StreamToppedUp_event as Types_StreamManager_StreamToppedUp_event} from './Types.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

import type {t as TestHelpers_MockDb_t} from './TestHelpers_MockDb.gen';

/** The arguements that get passed to a "processEvent" helper function */
export type EventFunctions_eventProcessorArgs<event> = {
  readonly event: event; 
  readonly mockDb: TestHelpers_MockDb_t; 
  readonly chainId?: number
};

export type EventFunctions_eventProcessor<event> = (_1:EventFunctions_eventProcessorArgs<event>) => Promise<TestHelpers_MockDb_t>;

export type EventFunctions_MockBlock_t = {
  readonly hash?: string; 
  readonly number?: number; 
  readonly timestamp?: number
};

export type EventFunctions_MockTransaction_t = {};

export type EventFunctions_mockEventData = {
  readonly chainId?: number; 
  readonly srcAddress?: Address_t; 
  readonly logIndex?: number; 
  readonly block?: EventFunctions_MockBlock_t; 
  readonly transaction?: EventFunctions_MockTransaction_t
};

export type DisputeResolver_DisputeOpened_createMockArgs = {
  readonly disputeId?: bigint; 
  readonly streamId?: bigint; 
  readonly subscriber?: Address_t; 
  readonly frozenAmount?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type DisputeResolver_DisputeResponded_createMockArgs = {
  readonly disputeId?: bigint; 
  readonly evidenceHash?: string; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type DisputeResolver_DisputeSettled_createMockArgs = {
  readonly disputeId?: bigint; 
  readonly verdict?: bigint; 
  readonly toSubscriber?: bigint; 
  readonly toMerchant?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type PlanRegistry_PlanCreated_createMockArgs = {
  readonly planId?: bigint; 
  readonly owner?: Address_t; 
  readonly ratePerSecond?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type PlanRegistry_PlanUpdated_createMockArgs = {
  readonly planId?: bigint; 
  readonly ratePerSecond?: bigint; 
  readonly gracePeriod?: bigint; 
  readonly disputePolicy?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type PlanRegistry_PlanDeactivated_createMockArgs = { readonly planId?: bigint; readonly mockEventData?: EventFunctions_mockEventData };

export type StreamManager_StreamCreated_createMockArgs = {
  readonly streamId?: bigint; 
  readonly planId?: bigint; 
  readonly payer?: Address_t; 
  readonly deposit?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type StreamManager_StreamCancelled_createMockArgs = {
  readonly streamId?: bigint; 
  readonly refund?: bigint; 
  readonly consumed?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type StreamManager_StreamToppedUp_createMockArgs = {
  readonly streamId?: bigint; 
  readonly amount?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type StreamManager_StreamPaused_createMockArgs = { readonly streamId?: bigint; readonly mockEventData?: EventFunctions_mockEventData };

export type StreamManager_StreamResumed_createMockArgs = { readonly streamId?: bigint; readonly mockEventData?: EventFunctions_mockEventData };

export type StreamManager_Claimed_createMockArgs = {
  readonly streamId?: bigint; 
  readonly merchant?: Address_t; 
  readonly amount?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export const MockDb_createMockDb: () => TestHelpers_MockDb_t = TestHelpersJS.MockDb.createMockDb as any;

export const Addresses_mockAddresses: Address_t[] = TestHelpersJS.Addresses.mockAddresses as any;

export const Addresses_defaultAddress: Address_t = TestHelpersJS.Addresses.defaultAddress as any;

export const DisputeResolver_DisputeOpened_processEvent: EventFunctions_eventProcessor<Types_DisputeResolver_DisputeOpened_event> = TestHelpersJS.DisputeResolver.DisputeOpened.processEvent as any;

export const DisputeResolver_DisputeOpened_createMockEvent: (args:DisputeResolver_DisputeOpened_createMockArgs) => Types_DisputeResolver_DisputeOpened_event = TestHelpersJS.DisputeResolver.DisputeOpened.createMockEvent as any;

export const DisputeResolver_DisputeResponded_processEvent: EventFunctions_eventProcessor<Types_DisputeResolver_DisputeResponded_event> = TestHelpersJS.DisputeResolver.DisputeResponded.processEvent as any;

export const DisputeResolver_DisputeResponded_createMockEvent: (args:DisputeResolver_DisputeResponded_createMockArgs) => Types_DisputeResolver_DisputeResponded_event = TestHelpersJS.DisputeResolver.DisputeResponded.createMockEvent as any;

export const DisputeResolver_DisputeSettled_processEvent: EventFunctions_eventProcessor<Types_DisputeResolver_DisputeSettled_event> = TestHelpersJS.DisputeResolver.DisputeSettled.processEvent as any;

export const DisputeResolver_DisputeSettled_createMockEvent: (args:DisputeResolver_DisputeSettled_createMockArgs) => Types_DisputeResolver_DisputeSettled_event = TestHelpersJS.DisputeResolver.DisputeSettled.createMockEvent as any;

export const PlanRegistry_PlanCreated_processEvent: EventFunctions_eventProcessor<Types_PlanRegistry_PlanCreated_event> = TestHelpersJS.PlanRegistry.PlanCreated.processEvent as any;

export const PlanRegistry_PlanCreated_createMockEvent: (args:PlanRegistry_PlanCreated_createMockArgs) => Types_PlanRegistry_PlanCreated_event = TestHelpersJS.PlanRegistry.PlanCreated.createMockEvent as any;

export const PlanRegistry_PlanUpdated_processEvent: EventFunctions_eventProcessor<Types_PlanRegistry_PlanUpdated_event> = TestHelpersJS.PlanRegistry.PlanUpdated.processEvent as any;

export const PlanRegistry_PlanUpdated_createMockEvent: (args:PlanRegistry_PlanUpdated_createMockArgs) => Types_PlanRegistry_PlanUpdated_event = TestHelpersJS.PlanRegistry.PlanUpdated.createMockEvent as any;

export const PlanRegistry_PlanDeactivated_processEvent: EventFunctions_eventProcessor<Types_PlanRegistry_PlanDeactivated_event> = TestHelpersJS.PlanRegistry.PlanDeactivated.processEvent as any;

export const PlanRegistry_PlanDeactivated_createMockEvent: (args:PlanRegistry_PlanDeactivated_createMockArgs) => Types_PlanRegistry_PlanDeactivated_event = TestHelpersJS.PlanRegistry.PlanDeactivated.createMockEvent as any;

export const StreamManager_StreamCreated_processEvent: EventFunctions_eventProcessor<Types_StreamManager_StreamCreated_event> = TestHelpersJS.StreamManager.StreamCreated.processEvent as any;

export const StreamManager_StreamCreated_createMockEvent: (args:StreamManager_StreamCreated_createMockArgs) => Types_StreamManager_StreamCreated_event = TestHelpersJS.StreamManager.StreamCreated.createMockEvent as any;

export const StreamManager_StreamCancelled_processEvent: EventFunctions_eventProcessor<Types_StreamManager_StreamCancelled_event> = TestHelpersJS.StreamManager.StreamCancelled.processEvent as any;

export const StreamManager_StreamCancelled_createMockEvent: (args:StreamManager_StreamCancelled_createMockArgs) => Types_StreamManager_StreamCancelled_event = TestHelpersJS.StreamManager.StreamCancelled.createMockEvent as any;

export const StreamManager_StreamToppedUp_processEvent: EventFunctions_eventProcessor<Types_StreamManager_StreamToppedUp_event> = TestHelpersJS.StreamManager.StreamToppedUp.processEvent as any;

export const StreamManager_StreamToppedUp_createMockEvent: (args:StreamManager_StreamToppedUp_createMockArgs) => Types_StreamManager_StreamToppedUp_event = TestHelpersJS.StreamManager.StreamToppedUp.createMockEvent as any;

export const StreamManager_StreamPaused_processEvent: EventFunctions_eventProcessor<Types_StreamManager_StreamPaused_event> = TestHelpersJS.StreamManager.StreamPaused.processEvent as any;

export const StreamManager_StreamPaused_createMockEvent: (args:StreamManager_StreamPaused_createMockArgs) => Types_StreamManager_StreamPaused_event = TestHelpersJS.StreamManager.StreamPaused.createMockEvent as any;

export const StreamManager_StreamResumed_processEvent: EventFunctions_eventProcessor<Types_StreamManager_StreamResumed_event> = TestHelpersJS.StreamManager.StreamResumed.processEvent as any;

export const StreamManager_StreamResumed_createMockEvent: (args:StreamManager_StreamResumed_createMockArgs) => Types_StreamManager_StreamResumed_event = TestHelpersJS.StreamManager.StreamResumed.createMockEvent as any;

export const StreamManager_Claimed_processEvent: EventFunctions_eventProcessor<Types_StreamManager_Claimed_event> = TestHelpersJS.StreamManager.Claimed.processEvent as any;

export const StreamManager_Claimed_createMockEvent: (args:StreamManager_Claimed_createMockArgs) => Types_StreamManager_Claimed_event = TestHelpersJS.StreamManager.Claimed.createMockEvent as any;

export const DisputeResolver: {
  DisputeOpened: {
    processEvent: EventFunctions_eventProcessor<Types_DisputeResolver_DisputeOpened_event>; 
    createMockEvent: (args:DisputeResolver_DisputeOpened_createMockArgs) => Types_DisputeResolver_DisputeOpened_event
  }; 
  DisputeSettled: {
    processEvent: EventFunctions_eventProcessor<Types_DisputeResolver_DisputeSettled_event>; 
    createMockEvent: (args:DisputeResolver_DisputeSettled_createMockArgs) => Types_DisputeResolver_DisputeSettled_event
  }; 
  DisputeResponded: {
    processEvent: EventFunctions_eventProcessor<Types_DisputeResolver_DisputeResponded_event>; 
    createMockEvent: (args:DisputeResolver_DisputeResponded_createMockArgs) => Types_DisputeResolver_DisputeResponded_event
  }
} = TestHelpersJS.DisputeResolver as any;

export const Addresses: { mockAddresses: Address_t[]; defaultAddress: Address_t } = TestHelpersJS.Addresses as any;

export const PlanRegistry: {
  PlanUpdated: {
    processEvent: EventFunctions_eventProcessor<Types_PlanRegistry_PlanUpdated_event>; 
    createMockEvent: (args:PlanRegistry_PlanUpdated_createMockArgs) => Types_PlanRegistry_PlanUpdated_event
  }; 
  PlanDeactivated: {
    processEvent: EventFunctions_eventProcessor<Types_PlanRegistry_PlanDeactivated_event>; 
    createMockEvent: (args:PlanRegistry_PlanDeactivated_createMockArgs) => Types_PlanRegistry_PlanDeactivated_event
  }; 
  PlanCreated: {
    processEvent: EventFunctions_eventProcessor<Types_PlanRegistry_PlanCreated_event>; 
    createMockEvent: (args:PlanRegistry_PlanCreated_createMockArgs) => Types_PlanRegistry_PlanCreated_event
  }
} = TestHelpersJS.PlanRegistry as any;

export const StreamManager: {
  StreamResumed: {
    processEvent: EventFunctions_eventProcessor<Types_StreamManager_StreamResumed_event>; 
    createMockEvent: (args:StreamManager_StreamResumed_createMockArgs) => Types_StreamManager_StreamResumed_event
  }; 
  StreamPaused: {
    processEvent: EventFunctions_eventProcessor<Types_StreamManager_StreamPaused_event>; 
    createMockEvent: (args:StreamManager_StreamPaused_createMockArgs) => Types_StreamManager_StreamPaused_event
  }; 
  StreamCancelled: {
    processEvent: EventFunctions_eventProcessor<Types_StreamManager_StreamCancelled_event>; 
    createMockEvent: (args:StreamManager_StreamCancelled_createMockArgs) => Types_StreamManager_StreamCancelled_event
  }; 
  StreamCreated: {
    processEvent: EventFunctions_eventProcessor<Types_StreamManager_StreamCreated_event>; 
    createMockEvent: (args:StreamManager_StreamCreated_createMockArgs) => Types_StreamManager_StreamCreated_event
  }; 
  StreamToppedUp: {
    processEvent: EventFunctions_eventProcessor<Types_StreamManager_StreamToppedUp_event>; 
    createMockEvent: (args:StreamManager_StreamToppedUp_createMockArgs) => Types_StreamManager_StreamToppedUp_event
  }; 
  Claimed: {
    processEvent: EventFunctions_eventProcessor<Types_StreamManager_Claimed_event>; 
    createMockEvent: (args:StreamManager_Claimed_createMockArgs) => Types_StreamManager_Claimed_event
  }
} = TestHelpersJS.StreamManager as any;

export const MockDb: { createMockDb: () => TestHelpers_MockDb_t } = TestHelpersJS.MockDb as any;
