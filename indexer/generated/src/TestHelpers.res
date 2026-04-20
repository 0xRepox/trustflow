/***** TAKE NOTE ******
This is a hack to get genType to work!

In order for genType to produce recursive types, it needs to be at the 
root module of a file. If it's defined in a nested module it does not 
work. So all the MockDb types and internal functions are defined in TestHelpers_MockDb
and only public functions are recreated and exported from this module.

the following module:
```rescript
module MyModule = {
  @genType
  type rec a = {fieldB: b}
  @genType and b = {fieldA: a}
}
```

produces the following in ts:
```ts
// tslint:disable-next-line:interface-over-type-literal
export type MyModule_a = { readonly fieldB: b };

// tslint:disable-next-line:interface-over-type-literal
export type MyModule_b = { readonly fieldA: MyModule_a };
```

fieldB references type b which doesn't exist because it's defined
as MyModule_b
*/

module MockDb = {
  @genType
  let createMockDb = TestHelpers_MockDb.createMockDb
}

@genType
module Addresses = {
  include TestHelpers_MockAddresses
}

module EventFunctions = {
  //Note these are made into a record to make operate in the same way
  //for Res, JS and TS.

  /**
  The arguements that get passed to a "processEvent" helper function
  */
  @genType
  type eventProcessorArgs<'event> = {
    event: 'event,
    mockDb: TestHelpers_MockDb.t,
    @deprecated("Set the chainId for the event instead")
    chainId?: int,
  }

  @genType
  type eventProcessor<'event> = eventProcessorArgs<'event> => promise<TestHelpers_MockDb.t>

  /**
  A function composer to help create individual processEvent functions
  */
  let makeEventProcessor = (~register) => args => {
    let {event, mockDb, ?chainId} =
      args->(Utils.magic: eventProcessorArgs<'event> => eventProcessorArgs<Internal.event>)

    // Have the line here, just in case the function is called with
    // a manually created event. We don't want to break the existing tests here.
    let _ =
      TestHelpers_MockDb.mockEventRegisters->Utils.WeakMap.set(event, register)
    TestHelpers_MockDb.makeProcessEvents(mockDb, ~chainId=?chainId)([event->(Utils.magic: Internal.event => Types.eventLog<unknown>)])
  }

  module MockBlock = {
    @genType
    type t = {
      @as("hash") hash?: string,
      @as("number") number?: int,
      @as("timestamp") timestamp?: int,
    }

    let toBlock = (_mock: t) => {
      hash: _mock.hash->Belt.Option.getWithDefault("foo"),
      number: _mock.number->Belt.Option.getWithDefault(0),
      timestamp: _mock.timestamp->Belt.Option.getWithDefault(0),
    }->(Utils.magic: Types.AggregatedBlock.t => Internal.eventBlock)
  }

  module MockTransaction = {
    @genType
    type t = {
    }

    let toTransaction = (_mock: t) => {
    }->(Utils.magic: Types.AggregatedTransaction.t => Internal.eventTransaction)
  }

  @genType
  type mockEventData = {
    chainId?: int,
    srcAddress?: Address.t,
    logIndex?: int,
    block?: MockBlock.t,
    transaction?: MockTransaction.t,
  }

  /**
  Applies optional paramters with defaults for all common eventLog field
  */
  let makeEventMocker = (
    ~params: Internal.eventParams,
    ~mockEventData: option<mockEventData>,
    ~register: unit => Internal.eventConfig,
  ): Internal.event => {
    let {?block, ?transaction, ?srcAddress, ?chainId, ?logIndex} =
      mockEventData->Belt.Option.getWithDefault({})
    let block = block->Belt.Option.getWithDefault({})->MockBlock.toBlock
    let transaction = transaction->Belt.Option.getWithDefault({})->MockTransaction.toTransaction
    let event: Internal.event = {
      params,
      transaction,
      chainId: switch chainId {
      | Some(chainId) => chainId
      | None =>
        switch Generated.configWithoutRegistrations.defaultChain {
        | Some(chainConfig) => chainConfig.id
        | None =>
          Js.Exn.raiseError(
            "No default chain Id found, please add at least 1 chain to your config.yaml",
          )
        }
      },
      block,
      srcAddress: srcAddress->Belt.Option.getWithDefault(Addresses.defaultAddress),
      logIndex: logIndex->Belt.Option.getWithDefault(0),
    }
    // Since currently it's not possible to figure out the event config from the event
    // we store a reference to the register function by event in a weak map
    let _ = TestHelpers_MockDb.mockEventRegisters->Utils.WeakMap.set(event, register)
    event
  }
}


module DisputeResolver = {
  module DisputeOpened = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.DisputeResolver.DisputeOpened.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.DisputeResolver.DisputeOpened.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("disputeId")
      disputeId?: bigint,
      @as("streamId")
      streamId?: bigint,
      @as("subscriber")
      subscriber?: Address.t,
      @as("frozenAmount")
      frozenAmount?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?disputeId,
        ?streamId,
        ?subscriber,
        ?frozenAmount,
        ?mockEventData,
      } = args

      let params = 
      {
       disputeId: disputeId->Belt.Option.getWithDefault(0n),
       streamId: streamId->Belt.Option.getWithDefault(0n),
       subscriber: subscriber->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       frozenAmount: frozenAmount->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.DisputeResolver.DisputeOpened.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.DisputeResolver.DisputeOpened.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.DisputeResolver.DisputeOpened.event)
    }
  }

  module DisputeResponded = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.DisputeResolver.DisputeResponded.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.DisputeResolver.DisputeResponded.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("disputeId")
      disputeId?: bigint,
      @as("evidenceHash")
      evidenceHash?: string,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?disputeId,
        ?evidenceHash,
        ?mockEventData,
      } = args

      let params = 
      {
       disputeId: disputeId->Belt.Option.getWithDefault(0n),
       evidenceHash: evidenceHash->Belt.Option.getWithDefault("foo"),
      }
->(Utils.magic: Types.DisputeResolver.DisputeResponded.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.DisputeResolver.DisputeResponded.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.DisputeResolver.DisputeResponded.event)
    }
  }

  module DisputeSettled = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.DisputeResolver.DisputeSettled.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.DisputeResolver.DisputeSettled.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("disputeId")
      disputeId?: bigint,
      @as("verdict")
      verdict?: bigint,
      @as("toSubscriber")
      toSubscriber?: bigint,
      @as("toMerchant")
      toMerchant?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?disputeId,
        ?verdict,
        ?toSubscriber,
        ?toMerchant,
        ?mockEventData,
      } = args

      let params = 
      {
       disputeId: disputeId->Belt.Option.getWithDefault(0n),
       verdict: verdict->Belt.Option.getWithDefault(0n),
       toSubscriber: toSubscriber->Belt.Option.getWithDefault(0n),
       toMerchant: toMerchant->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.DisputeResolver.DisputeSettled.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.DisputeResolver.DisputeSettled.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.DisputeResolver.DisputeSettled.event)
    }
  }

}


module PlanRegistry = {
  module PlanCreated = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.PlanRegistry.PlanCreated.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.PlanRegistry.PlanCreated.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("planId")
      planId?: bigint,
      @as("owner")
      owner?: Address.t,
      @as("ratePerSecond")
      ratePerSecond?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?planId,
        ?owner,
        ?ratePerSecond,
        ?mockEventData,
      } = args

      let params = 
      {
       planId: planId->Belt.Option.getWithDefault(0n),
       owner: owner->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       ratePerSecond: ratePerSecond->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.PlanRegistry.PlanCreated.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.PlanRegistry.PlanCreated.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.PlanRegistry.PlanCreated.event)
    }
  }

  module PlanUpdated = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.PlanRegistry.PlanUpdated.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.PlanRegistry.PlanUpdated.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("planId")
      planId?: bigint,
      @as("ratePerSecond")
      ratePerSecond?: bigint,
      @as("gracePeriod")
      gracePeriod?: bigint,
      @as("disputePolicy")
      disputePolicy?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?planId,
        ?ratePerSecond,
        ?gracePeriod,
        ?disputePolicy,
        ?mockEventData,
      } = args

      let params = 
      {
       planId: planId->Belt.Option.getWithDefault(0n),
       ratePerSecond: ratePerSecond->Belt.Option.getWithDefault(0n),
       gracePeriod: gracePeriod->Belt.Option.getWithDefault(0n),
       disputePolicy: disputePolicy->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.PlanRegistry.PlanUpdated.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.PlanRegistry.PlanUpdated.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.PlanRegistry.PlanUpdated.event)
    }
  }

  module PlanDeactivated = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.PlanRegistry.PlanDeactivated.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.PlanRegistry.PlanDeactivated.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("planId")
      planId?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?planId,
        ?mockEventData,
      } = args

      let params = 
      {
       planId: planId->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.PlanRegistry.PlanDeactivated.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.PlanRegistry.PlanDeactivated.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.PlanRegistry.PlanDeactivated.event)
    }
  }

}


module StreamManager = {
  module StreamCreated = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.StreamManager.StreamCreated.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.StreamManager.StreamCreated.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("streamId")
      streamId?: bigint,
      @as("planId")
      planId?: bigint,
      @as("payer")
      payer?: Address.t,
      @as("deposit")
      deposit?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?streamId,
        ?planId,
        ?payer,
        ?deposit,
        ?mockEventData,
      } = args

      let params = 
      {
       streamId: streamId->Belt.Option.getWithDefault(0n),
       planId: planId->Belt.Option.getWithDefault(0n),
       payer: payer->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       deposit: deposit->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.StreamManager.StreamCreated.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.StreamManager.StreamCreated.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.StreamManager.StreamCreated.event)
    }
  }

  module StreamCancelled = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.StreamManager.StreamCancelled.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.StreamManager.StreamCancelled.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("streamId")
      streamId?: bigint,
      @as("refund")
      refund?: bigint,
      @as("consumed")
      consumed?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?streamId,
        ?refund,
        ?consumed,
        ?mockEventData,
      } = args

      let params = 
      {
       streamId: streamId->Belt.Option.getWithDefault(0n),
       refund: refund->Belt.Option.getWithDefault(0n),
       consumed: consumed->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.StreamManager.StreamCancelled.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.StreamManager.StreamCancelled.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.StreamManager.StreamCancelled.event)
    }
  }

  module StreamToppedUp = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.StreamManager.StreamToppedUp.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.StreamManager.StreamToppedUp.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("streamId")
      streamId?: bigint,
      @as("amount")
      amount?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?streamId,
        ?amount,
        ?mockEventData,
      } = args

      let params = 
      {
       streamId: streamId->Belt.Option.getWithDefault(0n),
       amount: amount->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.StreamManager.StreamToppedUp.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.StreamManager.StreamToppedUp.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.StreamManager.StreamToppedUp.event)
    }
  }

  module StreamPaused = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.StreamManager.StreamPaused.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.StreamManager.StreamPaused.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("streamId")
      streamId?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?streamId,
        ?mockEventData,
      } = args

      let params = 
      {
       streamId: streamId->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.StreamManager.StreamPaused.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.StreamManager.StreamPaused.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.StreamManager.StreamPaused.event)
    }
  }

  module StreamResumed = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.StreamManager.StreamResumed.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.StreamManager.StreamResumed.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("streamId")
      streamId?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?streamId,
        ?mockEventData,
      } = args

      let params = 
      {
       streamId: streamId->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.StreamManager.StreamResumed.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.StreamManager.StreamResumed.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.StreamManager.StreamResumed.event)
    }
  }

  module Claimed = {
    @genType
    let processEvent: EventFunctions.eventProcessor<Types.StreamManager.Claimed.event> = EventFunctions.makeEventProcessor(
      ~register=(Types.StreamManager.Claimed.register :> unit => Internal.eventConfig),
    )

    @genType
    type createMockArgs = {
      @as("streamId")
      streamId?: bigint,
      @as("merchant")
      merchant?: Address.t,
      @as("amount")
      amount?: bigint,
      mockEventData?: EventFunctions.mockEventData,
    }

    @genType
    let createMockEvent = args => {
      let {
        ?streamId,
        ?merchant,
        ?amount,
        ?mockEventData,
      } = args

      let params = 
      {
       streamId: streamId->Belt.Option.getWithDefault(0n),
       merchant: merchant->Belt.Option.getWithDefault(TestHelpers_MockAddresses.defaultAddress),
       amount: amount->Belt.Option.getWithDefault(0n),
      }
->(Utils.magic: Types.StreamManager.Claimed.eventArgs => Internal.eventParams)

      EventFunctions.makeEventMocker(
        ~params,
        ~mockEventData,
        ~register=(Types.StreamManager.Claimed.register :> unit => Internal.eventConfig),
      )->(Utils.magic: Internal.event => Types.StreamManager.Claimed.event)
    }
  }

}

