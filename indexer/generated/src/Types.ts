// This file is to dynamically generate TS types
// which we can't get using GenType
// Use @genType.import to link the types back to ReScript code

import type { Logger, EffectCaller } from "envio";
import type * as Entities from "./db/Entities.gen.ts";

export type LoaderContext = {
  /**
   * Access the logger instance with event as a context. The logs will be displayed in the console and Envio Hosted Service.
   */
  readonly log: Logger;
  /**
   * Call the provided Effect with the given input.
   * Effects are the best for external calls with automatic deduplication, error handling and caching.
   * Define a new Effect using createEffect outside of the handler.
   */
  readonly effect: EffectCaller;
  /**
   * True when the handlers run in preload mode - in parallel for the whole batch.
   * Handlers run twice per batch of events, and the first time is the "preload" run
   * During preload entities aren't set, logs are ignored and exceptions are silently swallowed.
   * Preload mode is the best time to populate data to in-memory cache.
   * After preload the handler will run for the second time in sequential order of events.
   */
  readonly isPreload: boolean;
  /**
   * Per-chain state information accessible in event handlers and block handlers.
   * Each chain ID maps to an object containing chain-specific state:
   * - isReady: true when the chain has completed initial sync and is processing live events,
   *            false during historical synchronization
   */
  readonly chains: {
    [chainId: string]: {
      readonly isReady: boolean;
    };
  };
  readonly ClaimEvent: {
    /**
     * Load the entity ClaimEvent from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.ClaimEvent_t | undefined>,
    /**
     * Load the entity ClaimEvent from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.ClaimEvent_t>,
    readonly getWhere: Entities.ClaimEvent_indexedFieldOperations,
    /**
     * Returns the entity ClaimEvent from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.ClaimEvent_t) => Promise<Entities.ClaimEvent_t>,
    /**
     * Set the entity ClaimEvent in the storage.
     */
    readonly set: (entity: Entities.ClaimEvent_t) => void,
    /**
     * Delete the entity ClaimEvent from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Dispute: {
    /**
     * Load the entity Dispute from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Dispute_t | undefined>,
    /**
     * Load the entity Dispute from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Dispute_t>,
    readonly getWhere: Entities.Dispute_indexedFieldOperations,
    /**
     * Returns the entity Dispute from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Dispute_t) => Promise<Entities.Dispute_t>,
    /**
     * Set the entity Dispute in the storage.
     */
    readonly set: (entity: Entities.Dispute_t) => void,
    /**
     * Delete the entity Dispute from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Plan: {
    /**
     * Load the entity Plan from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Plan_t | undefined>,
    /**
     * Load the entity Plan from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Plan_t>,
    readonly getWhere: Entities.Plan_indexedFieldOperations,
    /**
     * Returns the entity Plan from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Plan_t) => Promise<Entities.Plan_t>,
    /**
     * Set the entity Plan in the storage.
     */
    readonly set: (entity: Entities.Plan_t) => void,
    /**
     * Delete the entity Plan from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Stream: {
    /**
     * Load the entity Stream from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Stream_t | undefined>,
    /**
     * Load the entity Stream from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Stream_t>,
    readonly getWhere: Entities.Stream_indexedFieldOperations,
    /**
     * Returns the entity Stream from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Stream_t) => Promise<Entities.Stream_t>,
    /**
     * Set the entity Stream in the storage.
     */
    readonly set: (entity: Entities.Stream_t) => void,
    /**
     * Delete the entity Stream from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
};

export type HandlerContext = {
  /**
   * Access the logger instance with event as a context. The logs will be displayed in the console and Envio Hosted Service.
   */
  readonly log: Logger;
  /**
   * Call the provided Effect with the given input.
   * Effects are the best for external calls with automatic deduplication, error handling and caching.
   * Define a new Effect using createEffect outside of the handler.
   */
  readonly effect: EffectCaller;
  /**
   * Per-chain state information accessible in event handlers and block handlers.
   * Each chain ID maps to an object containing chain-specific state:
   * - isReady: true when the chain has completed initial sync and is processing live events,
   *            false during historical synchronization
   */
  readonly chains: {
    [chainId: string]: {
      readonly isReady: boolean;
    };
  };
  readonly ClaimEvent: {
    /**
     * Load the entity ClaimEvent from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.ClaimEvent_t | undefined>,
    /**
     * Load the entity ClaimEvent from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.ClaimEvent_t>,
    /**
     * Returns the entity ClaimEvent from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.ClaimEvent_t) => Promise<Entities.ClaimEvent_t>,
    /**
     * Set the entity ClaimEvent in the storage.
     */
    readonly set: (entity: Entities.ClaimEvent_t) => void,
    /**
     * Delete the entity ClaimEvent from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Dispute: {
    /**
     * Load the entity Dispute from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Dispute_t | undefined>,
    /**
     * Load the entity Dispute from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Dispute_t>,
    /**
     * Returns the entity Dispute from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Dispute_t) => Promise<Entities.Dispute_t>,
    /**
     * Set the entity Dispute in the storage.
     */
    readonly set: (entity: Entities.Dispute_t) => void,
    /**
     * Delete the entity Dispute from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Plan: {
    /**
     * Load the entity Plan from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Plan_t | undefined>,
    /**
     * Load the entity Plan from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Plan_t>,
    /**
     * Returns the entity Plan from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Plan_t) => Promise<Entities.Plan_t>,
    /**
     * Set the entity Plan in the storage.
     */
    readonly set: (entity: Entities.Plan_t) => void,
    /**
     * Delete the entity Plan from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Stream: {
    /**
     * Load the entity Stream from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Stream_t | undefined>,
    /**
     * Load the entity Stream from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Stream_t>,
    /**
     * Returns the entity Stream from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Stream_t) => Promise<Entities.Stream_t>,
    /**
     * Set the entity Stream in the storage.
     */
    readonly set: (entity: Entities.Stream_t) => void,
    /**
     * Delete the entity Stream from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
};
