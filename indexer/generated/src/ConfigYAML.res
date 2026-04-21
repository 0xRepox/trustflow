
type hyperSyncConfig = {endpointUrl: string}
type hyperFuelConfig = {endpointUrl: string}

@genType.opaque
type rpcConfig = {
  syncConfig: Config.sourceSync,
}

@genType
type syncSource = HyperSync(hyperSyncConfig) | HyperFuel(hyperFuelConfig) | Rpc(rpcConfig)

@genType.opaque
type aliasAbi = Ethers.abi

type eventName = string

type contract = {
  name: string,
  abi: aliasAbi,
  addresses: array<string>,
  events: array<eventName>,
}

type configYaml = {
  syncSource,
  startBlock: int,
  confirmedBlockThreshold: int,
  contracts: dict<contract>,
  lowercaseAddresses: bool,
}

let publicConfig = ChainMap.fromArrayUnsafe([
  {
    let contracts = Js.Dict.fromArray([
      (
        "PlanRegistry",
        {
          name: "PlanRegistry",
          abi: Types.PlanRegistry.abi,
          addresses: [
            "0x276Ad3A0c2A96d2C135736c6Bde315Ff7d9F6648",
          ],
          events: [
            Types.PlanRegistry.PlanCreated.name,
            Types.PlanRegistry.PlanUpdated.name,
            Types.PlanRegistry.PlanDeactivated.name,
          ],
        }
      ),
      (
        "StreamManager",
        {
          name: "StreamManager",
          abi: Types.StreamManager.abi,
          addresses: [
            "0xb4cC364d19eb4473852316Ec7B8bcc6D87EF3954",
          ],
          events: [
            Types.StreamManager.StreamCreated.name,
            Types.StreamManager.StreamCancelled.name,
            Types.StreamManager.StreamToppedUp.name,
            Types.StreamManager.StreamPaused.name,
            Types.StreamManager.StreamResumed.name,
            Types.StreamManager.Claimed.name,
          ],
        }
      ),
      (
        "DisputeResolver",
        {
          name: "DisputeResolver",
          abi: Types.DisputeResolver.abi,
          addresses: [
            "0xc2fd9616d9d8Af35a6D89290bed4838Da3F5083d",
          ],
          events: [
            Types.DisputeResolver.DisputeOpened.name,
            Types.DisputeResolver.DisputeResponded.name,
            Types.DisputeResolver.DisputeSettled.name,
          ],
        }
      ),
    ])
    let chain = ChainMap.Chain.makeUnsafe(~chainId=5042002)
    (
      chain,
      {
        confirmedBlockThreshold: 200,
        syncSource: Rpc({syncConfig: NetworkSources.getSyncConfig({})}),
        startBlock: 37617000,
        contracts,
        lowercaseAddresses: false
      }
    )
  },
])

@genType
let getGeneratedByChainId: int => configYaml = chainId => {
  let chain = ChainMap.Chain.makeUnsafe(~chainId)
  if !(publicConfig->ChainMap.has(chain)) {
    Js.Exn.raiseError(
      "No chain with id " ++ chain->ChainMap.Chain.toString ++ " found in config.yaml",
    )
  }
  publicConfig->ChainMap.get(chain)
}
