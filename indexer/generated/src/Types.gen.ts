/* TypeScript file generated from Types.res by genType. */

/* eslint-disable */
/* tslint:disable */

import type {ClaimEvent_t as Entities_ClaimEvent_t} from '../src/db/Entities.gen';

import type {Dispute_t as Entities_Dispute_t} from '../src/db/Entities.gen';

import type {HandlerContext as $$handlerContext} from './Types.ts';

import type {HandlerWithOptions as $$fnWithEventConfig} from './bindings/OpaqueTypes.ts';

import type {LoaderContext as $$loaderContext} from './Types.ts';

import type {Plan_t as Entities_Plan_t} from '../src/db/Entities.gen';

import type {SingleOrMultiple as $$SingleOrMultiple_t} from './bindings/OpaqueTypes';

import type {Stream_t as Entities_Stream_t} from '../src/db/Entities.gen';

import type {entityHandlerContext as Internal_entityHandlerContext} from 'envio/src/Internal.gen';

import type {eventOptions as Internal_eventOptions} from 'envio/src/Internal.gen';

import type {genericContractRegisterArgs as Internal_genericContractRegisterArgs} from 'envio/src/Internal.gen';

import type {genericContractRegister as Internal_genericContractRegister} from 'envio/src/Internal.gen';

import type {genericEvent as Internal_genericEvent} from 'envio/src/Internal.gen';

import type {genericHandlerArgs as Internal_genericHandlerArgs} from 'envio/src/Internal.gen';

import type {genericHandlerWithLoader as Internal_genericHandlerWithLoader} from 'envio/src/Internal.gen';

import type {genericHandler as Internal_genericHandler} from 'envio/src/Internal.gen';

import type {genericLoaderArgs as Internal_genericLoaderArgs} from 'envio/src/Internal.gen';

import type {genericLoader as Internal_genericLoader} from 'envio/src/Internal.gen';

import type {logger as Envio_logger} from 'envio/src/Envio.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

export type id = string;
export type Id = id;

export type contractRegistrations = {
  readonly log: Envio_logger; 
  readonly addDisputeResolver: (_1:Address_t) => void; 
  readonly addPlanRegistry: (_1:Address_t) => void; 
  readonly addStreamManager: (_1:Address_t) => void
};

export type entityLoaderContext<entity,indexedFieldOperations> = {
  readonly get: (_1:id) => Promise<(undefined | entity)>; 
  readonly getOrThrow: (_1:id, message:(undefined | string)) => Promise<entity>; 
  readonly getWhere: indexedFieldOperations; 
  readonly getOrCreate: (_1:entity) => Promise<entity>; 
  readonly set: (_1:entity) => void; 
  readonly deleteUnsafe: (_1:id) => void
};

export type loaderContext = $$loaderContext;

export type entityHandlerContext<entity> = Internal_entityHandlerContext<entity>;

export type handlerContext = $$handlerContext;

export type claimEvent = Entities_ClaimEvent_t;
export type ClaimEvent = claimEvent;

export type dispute = Entities_Dispute_t;
export type Dispute = dispute;

export type plan = Entities_Plan_t;
export type Plan = plan;

export type stream = Entities_Stream_t;
export type Stream = stream;

export type Transaction_t = {};

export type Block_t = {
  readonly number: number; 
  readonly timestamp: number; 
  readonly hash: string
};

export type AggregatedBlock_t = {
  readonly hash: string; 
  readonly number: number; 
  readonly timestamp: number
};

export type AggregatedTransaction_t = {};

export type eventLog<params> = Internal_genericEvent<params,Block_t,Transaction_t>;
export type EventLog<params> = eventLog<params>;

export type SingleOrMultiple_t<a> = $$SingleOrMultiple_t<a>;

export type HandlerTypes_args<eventArgs,context> = { readonly event: eventLog<eventArgs>; readonly context: context };

export type HandlerTypes_contractRegisterArgs<eventArgs> = Internal_genericContractRegisterArgs<eventLog<eventArgs>,contractRegistrations>;

export type HandlerTypes_contractRegister<eventArgs> = Internal_genericContractRegister<HandlerTypes_contractRegisterArgs<eventArgs>>;

export type HandlerTypes_loaderArgs<eventArgs> = Internal_genericLoaderArgs<eventLog<eventArgs>,loaderContext>;

export type HandlerTypes_loader<eventArgs,loaderReturn> = Internal_genericLoader<HandlerTypes_loaderArgs<eventArgs>,loaderReturn>;

export type HandlerTypes_handlerArgs<eventArgs,loaderReturn> = Internal_genericHandlerArgs<eventLog<eventArgs>,handlerContext,loaderReturn>;

export type HandlerTypes_handler<eventArgs,loaderReturn> = Internal_genericHandler<HandlerTypes_handlerArgs<eventArgs,loaderReturn>>;

export type HandlerTypes_loaderHandler<eventArgs,loaderReturn,eventFilters> = Internal_genericHandlerWithLoader<HandlerTypes_loader<eventArgs,loaderReturn>,HandlerTypes_handler<eventArgs,loaderReturn>,eventFilters>;

export type HandlerTypes_eventConfig<eventFilters> = Internal_eventOptions<eventFilters>;

export type fnWithEventConfig<fn,eventConfig> = $$fnWithEventConfig<fn,eventConfig>;

export type handlerWithOptions<eventArgs,loaderReturn,eventFilters> = fnWithEventConfig<HandlerTypes_handler<eventArgs,loaderReturn>,HandlerTypes_eventConfig<eventFilters>>;

export type contractRegisterWithOptions<eventArgs,eventFilters> = fnWithEventConfig<HandlerTypes_contractRegister<eventArgs>,HandlerTypes_eventConfig<eventFilters>>;

export type DisputeResolver_chainId = 5042002;

export type DisputeResolver_DisputeOpened_eventArgs = {
  readonly disputeId: bigint; 
  readonly streamId: bigint; 
  readonly subscriber: Address_t; 
  readonly frozenAmount: bigint
};

export type DisputeResolver_DisputeOpened_block = Block_t;

export type DisputeResolver_DisputeOpened_transaction = Transaction_t;

export type DisputeResolver_DisputeOpened_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: DisputeResolver_DisputeOpened_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: DisputeResolver_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: DisputeResolver_DisputeOpened_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: DisputeResolver_DisputeOpened_block
};

export type DisputeResolver_DisputeOpened_loaderArgs = Internal_genericLoaderArgs<DisputeResolver_DisputeOpened_event,loaderContext>;

export type DisputeResolver_DisputeOpened_loader<loaderReturn> = Internal_genericLoader<DisputeResolver_DisputeOpened_loaderArgs,loaderReturn>;

export type DisputeResolver_DisputeOpened_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<DisputeResolver_DisputeOpened_event,handlerContext,loaderReturn>;

export type DisputeResolver_DisputeOpened_handler<loaderReturn> = Internal_genericHandler<DisputeResolver_DisputeOpened_handlerArgs<loaderReturn>>;

export type DisputeResolver_DisputeOpened_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<DisputeResolver_DisputeOpened_event,contractRegistrations>>;

export type DisputeResolver_DisputeOpened_eventFilter = {
  readonly disputeId?: SingleOrMultiple_t<bigint>; 
  readonly streamId?: SingleOrMultiple_t<bigint>; 
  readonly subscriber?: SingleOrMultiple_t<Address_t>
};

export type DisputeResolver_DisputeOpened_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: DisputeResolver_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type DisputeResolver_DisputeOpened_eventFiltersDefinition = 
    DisputeResolver_DisputeOpened_eventFilter
  | DisputeResolver_DisputeOpened_eventFilter[];

export type DisputeResolver_DisputeOpened_eventFilters = 
    DisputeResolver_DisputeOpened_eventFilter
  | DisputeResolver_DisputeOpened_eventFilter[]
  | ((_1:DisputeResolver_DisputeOpened_eventFiltersArgs) => DisputeResolver_DisputeOpened_eventFiltersDefinition);

export type DisputeResolver_DisputeResponded_eventArgs = { readonly disputeId: bigint; readonly evidenceHash: string };

export type DisputeResolver_DisputeResponded_block = Block_t;

export type DisputeResolver_DisputeResponded_transaction = Transaction_t;

export type DisputeResolver_DisputeResponded_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: DisputeResolver_DisputeResponded_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: DisputeResolver_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: DisputeResolver_DisputeResponded_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: DisputeResolver_DisputeResponded_block
};

export type DisputeResolver_DisputeResponded_loaderArgs = Internal_genericLoaderArgs<DisputeResolver_DisputeResponded_event,loaderContext>;

export type DisputeResolver_DisputeResponded_loader<loaderReturn> = Internal_genericLoader<DisputeResolver_DisputeResponded_loaderArgs,loaderReturn>;

export type DisputeResolver_DisputeResponded_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<DisputeResolver_DisputeResponded_event,handlerContext,loaderReturn>;

export type DisputeResolver_DisputeResponded_handler<loaderReturn> = Internal_genericHandler<DisputeResolver_DisputeResponded_handlerArgs<loaderReturn>>;

export type DisputeResolver_DisputeResponded_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<DisputeResolver_DisputeResponded_event,contractRegistrations>>;

export type DisputeResolver_DisputeResponded_eventFilter = { readonly disputeId?: SingleOrMultiple_t<bigint> };

export type DisputeResolver_DisputeResponded_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: DisputeResolver_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type DisputeResolver_DisputeResponded_eventFiltersDefinition = 
    DisputeResolver_DisputeResponded_eventFilter
  | DisputeResolver_DisputeResponded_eventFilter[];

export type DisputeResolver_DisputeResponded_eventFilters = 
    DisputeResolver_DisputeResponded_eventFilter
  | DisputeResolver_DisputeResponded_eventFilter[]
  | ((_1:DisputeResolver_DisputeResponded_eventFiltersArgs) => DisputeResolver_DisputeResponded_eventFiltersDefinition);

export type DisputeResolver_DisputeSettled_eventArgs = {
  readonly disputeId: bigint; 
  readonly verdict: bigint; 
  readonly toSubscriber: bigint; 
  readonly toMerchant: bigint
};

export type DisputeResolver_DisputeSettled_block = Block_t;

export type DisputeResolver_DisputeSettled_transaction = Transaction_t;

export type DisputeResolver_DisputeSettled_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: DisputeResolver_DisputeSettled_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: DisputeResolver_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: DisputeResolver_DisputeSettled_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: DisputeResolver_DisputeSettled_block
};

export type DisputeResolver_DisputeSettled_loaderArgs = Internal_genericLoaderArgs<DisputeResolver_DisputeSettled_event,loaderContext>;

export type DisputeResolver_DisputeSettled_loader<loaderReturn> = Internal_genericLoader<DisputeResolver_DisputeSettled_loaderArgs,loaderReturn>;

export type DisputeResolver_DisputeSettled_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<DisputeResolver_DisputeSettled_event,handlerContext,loaderReturn>;

export type DisputeResolver_DisputeSettled_handler<loaderReturn> = Internal_genericHandler<DisputeResolver_DisputeSettled_handlerArgs<loaderReturn>>;

export type DisputeResolver_DisputeSettled_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<DisputeResolver_DisputeSettled_event,contractRegistrations>>;

export type DisputeResolver_DisputeSettled_eventFilter = { readonly disputeId?: SingleOrMultiple_t<bigint> };

export type DisputeResolver_DisputeSettled_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: DisputeResolver_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type DisputeResolver_DisputeSettled_eventFiltersDefinition = 
    DisputeResolver_DisputeSettled_eventFilter
  | DisputeResolver_DisputeSettled_eventFilter[];

export type DisputeResolver_DisputeSettled_eventFilters = 
    DisputeResolver_DisputeSettled_eventFilter
  | DisputeResolver_DisputeSettled_eventFilter[]
  | ((_1:DisputeResolver_DisputeSettled_eventFiltersArgs) => DisputeResolver_DisputeSettled_eventFiltersDefinition);

export type PlanRegistry_chainId = 5042002;

export type PlanRegistry_PlanCreated_eventArgs = {
  readonly planId: bigint; 
  readonly owner: Address_t; 
  readonly ratePerSecond: bigint
};

export type PlanRegistry_PlanCreated_block = Block_t;

export type PlanRegistry_PlanCreated_transaction = Transaction_t;

export type PlanRegistry_PlanCreated_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: PlanRegistry_PlanCreated_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: PlanRegistry_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: PlanRegistry_PlanCreated_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: PlanRegistry_PlanCreated_block
};

export type PlanRegistry_PlanCreated_loaderArgs = Internal_genericLoaderArgs<PlanRegistry_PlanCreated_event,loaderContext>;

export type PlanRegistry_PlanCreated_loader<loaderReturn> = Internal_genericLoader<PlanRegistry_PlanCreated_loaderArgs,loaderReturn>;

export type PlanRegistry_PlanCreated_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<PlanRegistry_PlanCreated_event,handlerContext,loaderReturn>;

export type PlanRegistry_PlanCreated_handler<loaderReturn> = Internal_genericHandler<PlanRegistry_PlanCreated_handlerArgs<loaderReturn>>;

export type PlanRegistry_PlanCreated_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<PlanRegistry_PlanCreated_event,contractRegistrations>>;

export type PlanRegistry_PlanCreated_eventFilter = { readonly planId?: SingleOrMultiple_t<bigint>; readonly owner?: SingleOrMultiple_t<Address_t> };

export type PlanRegistry_PlanCreated_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: PlanRegistry_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type PlanRegistry_PlanCreated_eventFiltersDefinition = 
    PlanRegistry_PlanCreated_eventFilter
  | PlanRegistry_PlanCreated_eventFilter[];

export type PlanRegistry_PlanCreated_eventFilters = 
    PlanRegistry_PlanCreated_eventFilter
  | PlanRegistry_PlanCreated_eventFilter[]
  | ((_1:PlanRegistry_PlanCreated_eventFiltersArgs) => PlanRegistry_PlanCreated_eventFiltersDefinition);

export type PlanRegistry_PlanUpdated_eventArgs = {
  readonly planId: bigint; 
  readonly ratePerSecond: bigint; 
  readonly gracePeriod: bigint; 
  readonly disputePolicy: bigint
};

export type PlanRegistry_PlanUpdated_block = Block_t;

export type PlanRegistry_PlanUpdated_transaction = Transaction_t;

export type PlanRegistry_PlanUpdated_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: PlanRegistry_PlanUpdated_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: PlanRegistry_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: PlanRegistry_PlanUpdated_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: PlanRegistry_PlanUpdated_block
};

export type PlanRegistry_PlanUpdated_loaderArgs = Internal_genericLoaderArgs<PlanRegistry_PlanUpdated_event,loaderContext>;

export type PlanRegistry_PlanUpdated_loader<loaderReturn> = Internal_genericLoader<PlanRegistry_PlanUpdated_loaderArgs,loaderReturn>;

export type PlanRegistry_PlanUpdated_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<PlanRegistry_PlanUpdated_event,handlerContext,loaderReturn>;

export type PlanRegistry_PlanUpdated_handler<loaderReturn> = Internal_genericHandler<PlanRegistry_PlanUpdated_handlerArgs<loaderReturn>>;

export type PlanRegistry_PlanUpdated_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<PlanRegistry_PlanUpdated_event,contractRegistrations>>;

export type PlanRegistry_PlanUpdated_eventFilter = { readonly planId?: SingleOrMultiple_t<bigint> };

export type PlanRegistry_PlanUpdated_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: PlanRegistry_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type PlanRegistry_PlanUpdated_eventFiltersDefinition = 
    PlanRegistry_PlanUpdated_eventFilter
  | PlanRegistry_PlanUpdated_eventFilter[];

export type PlanRegistry_PlanUpdated_eventFilters = 
    PlanRegistry_PlanUpdated_eventFilter
  | PlanRegistry_PlanUpdated_eventFilter[]
  | ((_1:PlanRegistry_PlanUpdated_eventFiltersArgs) => PlanRegistry_PlanUpdated_eventFiltersDefinition);

export type PlanRegistry_PlanDeactivated_eventArgs = { readonly planId: bigint };

export type PlanRegistry_PlanDeactivated_block = Block_t;

export type PlanRegistry_PlanDeactivated_transaction = Transaction_t;

export type PlanRegistry_PlanDeactivated_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: PlanRegistry_PlanDeactivated_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: PlanRegistry_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: PlanRegistry_PlanDeactivated_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: PlanRegistry_PlanDeactivated_block
};

export type PlanRegistry_PlanDeactivated_loaderArgs = Internal_genericLoaderArgs<PlanRegistry_PlanDeactivated_event,loaderContext>;

export type PlanRegistry_PlanDeactivated_loader<loaderReturn> = Internal_genericLoader<PlanRegistry_PlanDeactivated_loaderArgs,loaderReturn>;

export type PlanRegistry_PlanDeactivated_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<PlanRegistry_PlanDeactivated_event,handlerContext,loaderReturn>;

export type PlanRegistry_PlanDeactivated_handler<loaderReturn> = Internal_genericHandler<PlanRegistry_PlanDeactivated_handlerArgs<loaderReturn>>;

export type PlanRegistry_PlanDeactivated_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<PlanRegistry_PlanDeactivated_event,contractRegistrations>>;

export type PlanRegistry_PlanDeactivated_eventFilter = { readonly planId?: SingleOrMultiple_t<bigint> };

export type PlanRegistry_PlanDeactivated_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: PlanRegistry_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type PlanRegistry_PlanDeactivated_eventFiltersDefinition = 
    PlanRegistry_PlanDeactivated_eventFilter
  | PlanRegistry_PlanDeactivated_eventFilter[];

export type PlanRegistry_PlanDeactivated_eventFilters = 
    PlanRegistry_PlanDeactivated_eventFilter
  | PlanRegistry_PlanDeactivated_eventFilter[]
  | ((_1:PlanRegistry_PlanDeactivated_eventFiltersArgs) => PlanRegistry_PlanDeactivated_eventFiltersDefinition);

export type StreamManager_chainId = 5042002;

export type StreamManager_StreamCreated_eventArgs = {
  readonly streamId: bigint; 
  readonly planId: bigint; 
  readonly payer: Address_t; 
  readonly deposit: bigint
};

export type StreamManager_StreamCreated_block = Block_t;

export type StreamManager_StreamCreated_transaction = Transaction_t;

export type StreamManager_StreamCreated_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: StreamManager_StreamCreated_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: StreamManager_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: StreamManager_StreamCreated_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: StreamManager_StreamCreated_block
};

export type StreamManager_StreamCreated_loaderArgs = Internal_genericLoaderArgs<StreamManager_StreamCreated_event,loaderContext>;

export type StreamManager_StreamCreated_loader<loaderReturn> = Internal_genericLoader<StreamManager_StreamCreated_loaderArgs,loaderReturn>;

export type StreamManager_StreamCreated_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<StreamManager_StreamCreated_event,handlerContext,loaderReturn>;

export type StreamManager_StreamCreated_handler<loaderReturn> = Internal_genericHandler<StreamManager_StreamCreated_handlerArgs<loaderReturn>>;

export type StreamManager_StreamCreated_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<StreamManager_StreamCreated_event,contractRegistrations>>;

export type StreamManager_StreamCreated_eventFilter = {
  readonly streamId?: SingleOrMultiple_t<bigint>; 
  readonly planId?: SingleOrMultiple_t<bigint>; 
  readonly payer?: SingleOrMultiple_t<Address_t>
};

export type StreamManager_StreamCreated_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: StreamManager_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type StreamManager_StreamCreated_eventFiltersDefinition = 
    StreamManager_StreamCreated_eventFilter
  | StreamManager_StreamCreated_eventFilter[];

export type StreamManager_StreamCreated_eventFilters = 
    StreamManager_StreamCreated_eventFilter
  | StreamManager_StreamCreated_eventFilter[]
  | ((_1:StreamManager_StreamCreated_eventFiltersArgs) => StreamManager_StreamCreated_eventFiltersDefinition);

export type StreamManager_StreamCancelled_eventArgs = {
  readonly streamId: bigint; 
  readonly refund: bigint; 
  readonly consumed: bigint
};

export type StreamManager_StreamCancelled_block = Block_t;

export type StreamManager_StreamCancelled_transaction = Transaction_t;

export type StreamManager_StreamCancelled_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: StreamManager_StreamCancelled_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: StreamManager_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: StreamManager_StreamCancelled_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: StreamManager_StreamCancelled_block
};

export type StreamManager_StreamCancelled_loaderArgs = Internal_genericLoaderArgs<StreamManager_StreamCancelled_event,loaderContext>;

export type StreamManager_StreamCancelled_loader<loaderReturn> = Internal_genericLoader<StreamManager_StreamCancelled_loaderArgs,loaderReturn>;

export type StreamManager_StreamCancelled_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<StreamManager_StreamCancelled_event,handlerContext,loaderReturn>;

export type StreamManager_StreamCancelled_handler<loaderReturn> = Internal_genericHandler<StreamManager_StreamCancelled_handlerArgs<loaderReturn>>;

export type StreamManager_StreamCancelled_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<StreamManager_StreamCancelled_event,contractRegistrations>>;

export type StreamManager_StreamCancelled_eventFilter = { readonly streamId?: SingleOrMultiple_t<bigint> };

export type StreamManager_StreamCancelled_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: StreamManager_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type StreamManager_StreamCancelled_eventFiltersDefinition = 
    StreamManager_StreamCancelled_eventFilter
  | StreamManager_StreamCancelled_eventFilter[];

export type StreamManager_StreamCancelled_eventFilters = 
    StreamManager_StreamCancelled_eventFilter
  | StreamManager_StreamCancelled_eventFilter[]
  | ((_1:StreamManager_StreamCancelled_eventFiltersArgs) => StreamManager_StreamCancelled_eventFiltersDefinition);

export type StreamManager_StreamToppedUp_eventArgs = { readonly streamId: bigint; readonly amount: bigint };

export type StreamManager_StreamToppedUp_block = Block_t;

export type StreamManager_StreamToppedUp_transaction = Transaction_t;

export type StreamManager_StreamToppedUp_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: StreamManager_StreamToppedUp_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: StreamManager_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: StreamManager_StreamToppedUp_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: StreamManager_StreamToppedUp_block
};

export type StreamManager_StreamToppedUp_loaderArgs = Internal_genericLoaderArgs<StreamManager_StreamToppedUp_event,loaderContext>;

export type StreamManager_StreamToppedUp_loader<loaderReturn> = Internal_genericLoader<StreamManager_StreamToppedUp_loaderArgs,loaderReturn>;

export type StreamManager_StreamToppedUp_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<StreamManager_StreamToppedUp_event,handlerContext,loaderReturn>;

export type StreamManager_StreamToppedUp_handler<loaderReturn> = Internal_genericHandler<StreamManager_StreamToppedUp_handlerArgs<loaderReturn>>;

export type StreamManager_StreamToppedUp_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<StreamManager_StreamToppedUp_event,contractRegistrations>>;

export type StreamManager_StreamToppedUp_eventFilter = { readonly streamId?: SingleOrMultiple_t<bigint> };

export type StreamManager_StreamToppedUp_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: StreamManager_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type StreamManager_StreamToppedUp_eventFiltersDefinition = 
    StreamManager_StreamToppedUp_eventFilter
  | StreamManager_StreamToppedUp_eventFilter[];

export type StreamManager_StreamToppedUp_eventFilters = 
    StreamManager_StreamToppedUp_eventFilter
  | StreamManager_StreamToppedUp_eventFilter[]
  | ((_1:StreamManager_StreamToppedUp_eventFiltersArgs) => StreamManager_StreamToppedUp_eventFiltersDefinition);

export type StreamManager_StreamPaused_eventArgs = { readonly streamId: bigint };

export type StreamManager_StreamPaused_block = Block_t;

export type StreamManager_StreamPaused_transaction = Transaction_t;

export type StreamManager_StreamPaused_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: StreamManager_StreamPaused_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: StreamManager_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: StreamManager_StreamPaused_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: StreamManager_StreamPaused_block
};

export type StreamManager_StreamPaused_loaderArgs = Internal_genericLoaderArgs<StreamManager_StreamPaused_event,loaderContext>;

export type StreamManager_StreamPaused_loader<loaderReturn> = Internal_genericLoader<StreamManager_StreamPaused_loaderArgs,loaderReturn>;

export type StreamManager_StreamPaused_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<StreamManager_StreamPaused_event,handlerContext,loaderReturn>;

export type StreamManager_StreamPaused_handler<loaderReturn> = Internal_genericHandler<StreamManager_StreamPaused_handlerArgs<loaderReturn>>;

export type StreamManager_StreamPaused_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<StreamManager_StreamPaused_event,contractRegistrations>>;

export type StreamManager_StreamPaused_eventFilter = { readonly streamId?: SingleOrMultiple_t<bigint> };

export type StreamManager_StreamPaused_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: StreamManager_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type StreamManager_StreamPaused_eventFiltersDefinition = 
    StreamManager_StreamPaused_eventFilter
  | StreamManager_StreamPaused_eventFilter[];

export type StreamManager_StreamPaused_eventFilters = 
    StreamManager_StreamPaused_eventFilter
  | StreamManager_StreamPaused_eventFilter[]
  | ((_1:StreamManager_StreamPaused_eventFiltersArgs) => StreamManager_StreamPaused_eventFiltersDefinition);

export type StreamManager_StreamResumed_eventArgs = { readonly streamId: bigint };

export type StreamManager_StreamResumed_block = Block_t;

export type StreamManager_StreamResumed_transaction = Transaction_t;

export type StreamManager_StreamResumed_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: StreamManager_StreamResumed_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: StreamManager_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: StreamManager_StreamResumed_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: StreamManager_StreamResumed_block
};

export type StreamManager_StreamResumed_loaderArgs = Internal_genericLoaderArgs<StreamManager_StreamResumed_event,loaderContext>;

export type StreamManager_StreamResumed_loader<loaderReturn> = Internal_genericLoader<StreamManager_StreamResumed_loaderArgs,loaderReturn>;

export type StreamManager_StreamResumed_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<StreamManager_StreamResumed_event,handlerContext,loaderReturn>;

export type StreamManager_StreamResumed_handler<loaderReturn> = Internal_genericHandler<StreamManager_StreamResumed_handlerArgs<loaderReturn>>;

export type StreamManager_StreamResumed_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<StreamManager_StreamResumed_event,contractRegistrations>>;

export type StreamManager_StreamResumed_eventFilter = { readonly streamId?: SingleOrMultiple_t<bigint> };

export type StreamManager_StreamResumed_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: StreamManager_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type StreamManager_StreamResumed_eventFiltersDefinition = 
    StreamManager_StreamResumed_eventFilter
  | StreamManager_StreamResumed_eventFilter[];

export type StreamManager_StreamResumed_eventFilters = 
    StreamManager_StreamResumed_eventFilter
  | StreamManager_StreamResumed_eventFilter[]
  | ((_1:StreamManager_StreamResumed_eventFiltersArgs) => StreamManager_StreamResumed_eventFiltersDefinition);

export type StreamManager_Claimed_eventArgs = {
  readonly streamId: bigint; 
  readonly merchant: Address_t; 
  readonly amount: bigint
};

export type StreamManager_Claimed_block = Block_t;

export type StreamManager_Claimed_transaction = Transaction_t;

export type StreamManager_Claimed_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: StreamManager_Claimed_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: StreamManager_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: StreamManager_Claimed_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: StreamManager_Claimed_block
};

export type StreamManager_Claimed_loaderArgs = Internal_genericLoaderArgs<StreamManager_Claimed_event,loaderContext>;

export type StreamManager_Claimed_loader<loaderReturn> = Internal_genericLoader<StreamManager_Claimed_loaderArgs,loaderReturn>;

export type StreamManager_Claimed_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<StreamManager_Claimed_event,handlerContext,loaderReturn>;

export type StreamManager_Claimed_handler<loaderReturn> = Internal_genericHandler<StreamManager_Claimed_handlerArgs<loaderReturn>>;

export type StreamManager_Claimed_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<StreamManager_Claimed_event,contractRegistrations>>;

export type StreamManager_Claimed_eventFilter = { readonly streamId?: SingleOrMultiple_t<bigint>; readonly merchant?: SingleOrMultiple_t<Address_t> };

export type StreamManager_Claimed_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: StreamManager_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type StreamManager_Claimed_eventFiltersDefinition = 
    StreamManager_Claimed_eventFilter
  | StreamManager_Claimed_eventFilter[];

export type StreamManager_Claimed_eventFilters = 
    StreamManager_Claimed_eventFilter
  | StreamManager_Claimed_eventFilter[]
  | ((_1:StreamManager_Claimed_eventFiltersArgs) => StreamManager_Claimed_eventFiltersDefinition);

export type chainId = number;

export type chain = 5042002;
