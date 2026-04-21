@val external require: string => unit = "require"

let registerContractHandlers = (
  ~contractName,
  ~handlerPathRelativeToRoot,
  ~handlerPathRelativeToConfig,
) => {
  try {
    require(`../${Path.relativePathToRootFromGenerated}/${handlerPathRelativeToRoot}`)
  } catch {
  | exn =>
    let params = {
      "Contract Name": contractName,
      "Expected Handler Path": handlerPathRelativeToConfig,
      "Code": "EE500",
    }
    let logger = Logging.createChild(~params)

    let errHandler = exn->ErrorHandling.make(~msg="Failed to import handler file", ~logger)
    errHandler->ErrorHandling.log
    errHandler->ErrorHandling.raiseExn
  }
}

let makeGeneratedConfig = () => {
  let chains = [
    {
      let contracts = [
        {
          Config.name: "PlanRegistry",
          abi: Types.PlanRegistry.abi,
          addresses: [
            "0x276Ad3A0c2A96d2C135736c6Bde315Ff7d9F6648"->Address.Evm.fromStringOrThrow
,
          ],
          events: [
            (Types.PlanRegistry.PlanCreated.register() :> Internal.eventConfig),
            (Types.PlanRegistry.PlanUpdated.register() :> Internal.eventConfig),
            (Types.PlanRegistry.PlanDeactivated.register() :> Internal.eventConfig),
          ],
          startBlock: None,
        },
        {
          Config.name: "StreamManager",
          abi: Types.StreamManager.abi,
          addresses: [
            "0xb4cC364d19eb4473852316Ec7B8bcc6D87EF3954"->Address.Evm.fromStringOrThrow
,
          ],
          events: [
            (Types.StreamManager.StreamCreated.register() :> Internal.eventConfig),
            (Types.StreamManager.StreamCancelled.register() :> Internal.eventConfig),
            (Types.StreamManager.StreamToppedUp.register() :> Internal.eventConfig),
            (Types.StreamManager.StreamPaused.register() :> Internal.eventConfig),
            (Types.StreamManager.StreamResumed.register() :> Internal.eventConfig),
            (Types.StreamManager.Claimed.register() :> Internal.eventConfig),
          ],
          startBlock: None,
        },
        {
          Config.name: "DisputeResolver",
          abi: Types.DisputeResolver.abi,
          addresses: [
            "0xc2fd9616d9d8Af35a6D89290bed4838Da3F5083d"->Address.Evm.fromStringOrThrow
,
          ],
          events: [
            (Types.DisputeResolver.DisputeOpened.register() :> Internal.eventConfig),
            (Types.DisputeResolver.DisputeResponded.register() :> Internal.eventConfig),
            (Types.DisputeResolver.DisputeSettled.register() :> Internal.eventConfig),
          ],
          startBlock: None,
        },
      ]
      let chain = ChainMap.Chain.makeUnsafe(~chainId=5042002)
      {
        Config.maxReorgDepth: 200,
        startBlock: 37617000,
        id: 5042002,
        contracts,
        sources: NetworkSources.evm(~chain, ~contracts=[{name: "PlanRegistry",events: [Types.PlanRegistry.PlanCreated.register(), Types.PlanRegistry.PlanUpdated.register(), Types.PlanRegistry.PlanDeactivated.register()],abi: Types.PlanRegistry.abi}, {name: "StreamManager",events: [Types.StreamManager.StreamCreated.register(), Types.StreamManager.StreamCancelled.register(), Types.StreamManager.StreamToppedUp.register(), Types.StreamManager.StreamPaused.register(), Types.StreamManager.StreamResumed.register(), Types.StreamManager.Claimed.register()],abi: Types.StreamManager.abi}, {name: "DisputeResolver",events: [Types.DisputeResolver.DisputeOpened.register(), Types.DisputeResolver.DisputeResponded.register(), Types.DisputeResolver.DisputeSettled.register()],abi: Types.DisputeResolver.abi}], ~hyperSync=None, ~allEventSignatures=[Types.PlanRegistry.eventSignatures, Types.StreamManager.eventSignatures, Types.DisputeResolver.eventSignatures]->Belt.Array.concatMany, ~shouldUseHypersyncClientDecoder=true, ~rpcs=[{url: "https://rpc.testnet.arc.network", sourceFor: Sync, syncConfig: {}}], ~lowercaseAddresses=false)
      }
    },
  ]

  Config.make(
    ~shouldRollbackOnReorg=true,
    ~shouldSaveFullHistory=false,
    ~multichain=if (
      Env.Configurable.isUnorderedMultichainMode->Belt.Option.getWithDefault(
        Env.Configurable.unstable__temp_unordered_head_mode->Belt.Option.getWithDefault(
          false,
        ),
      )
    ) {
      Unordered
    } else {
      Ordered
    },
    ~chains,
    ~enableRawEvents=false,
    ~batchSize=?Env.batchSize,
    ~preloadHandlers=false,
    ~lowercaseAddresses=false,
    ~shouldUseHypersyncClientDecoder=true,
  )
}

let configWithoutRegistrations = makeGeneratedConfig()

let registerAllHandlers = () => {
  EventRegister.startRegistration(
    ~ecosystem=configWithoutRegistrations.ecosystem,
    ~multichain=configWithoutRegistrations.multichain,
    ~preloadHandlers=configWithoutRegistrations.preloadHandlers,
  )

  registerContractHandlers(
    ~contractName="DisputeResolver",
    ~handlerPathRelativeToRoot="src/EventHandlers.ts",
    ~handlerPathRelativeToConfig="src/EventHandlers.ts",
  )
  registerContractHandlers(
    ~contractName="PlanRegistry",
    ~handlerPathRelativeToRoot="src/EventHandlers.ts",
    ~handlerPathRelativeToConfig="src/EventHandlers.ts",
  )
  registerContractHandlers(
    ~contractName="StreamManager",
    ~handlerPathRelativeToRoot="src/EventHandlers.ts",
    ~handlerPathRelativeToConfig="src/EventHandlers.ts",
  )

  EventRegister.finishRegistration()
}

let initialSql = Db.makeClient()
let storagePgSchema = Env.Db.publicSchema
let makeStorage = (~sql, ~pgSchema=storagePgSchema, ~isHasuraEnabled=Env.Hasura.enabled) => {
  PgStorage.make(
    ~sql,
    ~pgSchema,
    ~pgHost=Env.Db.host,
    ~pgUser=Env.Db.user,
    ~pgPort=Env.Db.port,
    ~pgDatabase=Env.Db.database,
    ~pgPassword=Env.Db.password,
    ~onInitialize=?{
      if isHasuraEnabled {
        Some(
          () => {
            Hasura.trackDatabase(
              ~endpoint=Env.Hasura.graphqlEndpoint,
              ~auth={
                role: Env.Hasura.role,
                secret: Env.Hasura.secret,
              },
              ~pgSchema=storagePgSchema,
              ~userEntities=Entities.userEntities,
              ~responseLimit=Env.Hasura.responseLimit,
              ~schema=Db.schema,
              ~aggregateEntities=Env.Hasura.aggregateEntities,
            )->Promise.catch(err => {
              Logging.errorWithExn(
                err->Utils.prettifyExn,
                `EE803: Error tracking tables`,
              )->Promise.resolve
            })
          },
        )
      } else {
        None
      }
    },
    ~onNewTables=?{
      if isHasuraEnabled {
        Some(
          (~tableNames) => {
            Hasura.trackTables(
              ~endpoint=Env.Hasura.graphqlEndpoint,
              ~auth={
                role: Env.Hasura.role,
                secret: Env.Hasura.secret,
              },
              ~pgSchema=storagePgSchema,
              ~tableNames,
            )->Promise.catch(err => {
              Logging.errorWithExn(
                err->Utils.prettifyExn,
                `EE804: Error tracking new tables`,
              )->Promise.resolve
            })
          },
        )
      } else {
        None
      }
    },
    ~isHasuraEnabled,
  )
}

let codegenPersistence = Persistence.make(
  ~userEntities=Entities.userEntities,
  ~allEnums=Enums.allEnums,
  ~storage=makeStorage(~sql=initialSql),
  ~sql=initialSql,
)

%%private(let indexer: ref<option<Indexer.t>> = ref(None))
let getIndexer = () => {
  switch indexer.contents {
  | Some(indexer) => indexer
  | None =>
    let i = {
      Indexer.registrations: registerAllHandlers(),
      // Need to recreate initial config one more time,
      // since configWithoutRegistrations called register for event
      // before they were ready
      config: makeGeneratedConfig(),
      persistence: codegenPersistence,
    }
    indexer := Some(i)
    i
  }
}
