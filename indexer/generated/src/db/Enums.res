module ContractType = {
  @genType
  type t = 
    | @as("DisputeResolver") DisputeResolver
    | @as("PlanRegistry") PlanRegistry
    | @as("StreamManager") StreamManager

  let name = "CONTRACT_TYPE"
  let variants = [
    DisputeResolver,
    PlanRegistry,
    StreamManager,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

module EntityType = {
  @genType
  type t = 
    | @as("ClaimEvent") ClaimEvent
    | @as("Dispute") Dispute
    | @as("Plan") Plan
    | @as("Stream") Stream
    | @as("dynamic_contract_registry") DynamicContractRegistry

  let name = "ENTITY_TYPE"
  let variants = [
    ClaimEvent,
    Dispute,
    Plan,
    Stream,
    DynamicContractRegistry,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

let allEnums = ([
  ContractType.config->Internal.fromGenericEnumConfig,
  EntityType.config->Internal.fromGenericEnumConfig,
])
