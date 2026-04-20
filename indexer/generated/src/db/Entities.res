open Table
open Enums.EntityType
type id = string

type internalEntity = Internal.entity
module type Entity = {
  type t
  let index: int
  let name: string
  let schema: S.t<t>
  let rowsSchema: S.t<array<t>>
  let table: Table.table
  let entityHistory: EntityHistory.t<t>
}
external entityModToInternal: module(Entity with type t = 'a) => Internal.entityConfig = "%identity"
external entityModsToInternal: array<module(Entity)> => array<Internal.entityConfig> = "%identity"
external entitiesToInternal: array<'a> => array<Internal.entity> = "%identity"

@get
external getEntityId: internalEntity => string = "id"

// Use InMemoryTable.Entity.getEntityIdUnsafe instead of duplicating the logic
let getEntityIdUnsafe = InMemoryTable.Entity.getEntityIdUnsafe

//shorthand for punning
let isPrimaryKey = true
let isNullable = true
let isArray = true
let isIndex = true

@genType
type whereOperations<'entity, 'fieldType> = {
  eq: 'fieldType => promise<array<'entity>>,
  gt: 'fieldType => promise<array<'entity>>,
  lt: 'fieldType => promise<array<'entity>>
}

module ClaimEvent = {
  let name = (ClaimEvent :> string)
  let index = 0
  @genType
  type t = {
    amount: string,
    blockNumber: int,
    id: id,
    merchant: string,
    stream_id: id,
    timestamp: int,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", S.string),
    blockNumber: s.field("blockNumber", S.int),
    id: s.field("id", S.string),
    merchant: s.field("merchant", S.string),
    stream_id: s.field("stream_id", S.string),
    timestamp: s.field("timestamp", S.int),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("stream_id") stream_id: whereOperations<t, id>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "blockNumber", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "merchant", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "stream", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      ~linkedEntity="Stream",
      ),
      mkField(
      "timestamp", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module Dispute = {
  let name = (Dispute :> string)
  let index = 1
  @genType
  type t = {
    evidenceHash: option<string>,
    frozenAmount: string,
    id: id,
    openedAt: int,
    settledAt: option<int>,
    status: string,
    stream_id: id,
    subscriber: string,
    verdict: option<string>,
  }

  let schema = S.object((s): t => {
    evidenceHash: s.field("evidenceHash", S.null(S.string)),
    frozenAmount: s.field("frozenAmount", S.string),
    id: s.field("id", S.string),
    openedAt: s.field("openedAt", S.int),
    settledAt: s.field("settledAt", S.null(S.int)),
    status: s.field("status", S.string),
    stream_id: s.field("stream_id", S.string),
    subscriber: s.field("subscriber", S.string),
    verdict: s.field("verdict", S.null(S.string)),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("stream_id") stream_id: whereOperations<t, id>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "evidenceHash", 
      Text,
      ~fieldSchema=S.null(S.string),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "frozenAmount", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "openedAt", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "settledAt", 
      Integer,
      ~fieldSchema=S.null(S.int),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "status", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "stream", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      ~linkedEntity="Stream",
      ),
      mkField(
      "subscriber", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "verdict", 
      Text,
      ~fieldSchema=S.null(S.string),
      
      ~isNullable,
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module Plan = {
  let name = (Plan :> string)
  let index = 2
  @genType
  type t = {
    active: bool,
    createdAt: int,
    disputePolicy: int,
    gracePeriod: int,
    id: id,
    owner: string,
    ratePerSecond: string,
    
  }

  let schema = S.object((s): t => {
    active: s.field("active", S.bool),
    createdAt: s.field("createdAt", S.int),
    disputePolicy: s.field("disputePolicy", S.int),
    gracePeriod: s.field("gracePeriod", S.int),
    id: s.field("id", S.string),
    owner: s.field("owner", S.string),
    ratePerSecond: s.field("ratePerSecond", S.string),
    
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "active", 
      Boolean,
      ~fieldSchema=S.bool,
      
      
      
      
      
      ),
      mkField(
      "createdAt", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "disputePolicy", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "gracePeriod", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "owner", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "ratePerSecond", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkDerivedFromField(
      "streams", 
      ~derivedFromEntity="Stream",
      ~derivedFromField="plan",
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module Stream = {
  let name = (Stream :> string)
  let index = 3
  @genType
  type t = {
    cancelledAt: option<int>,
    claimed: string,
    
    consumed: string,
    createdAt: int,
    deposited: string,
    
    id: id,
    payer: string,
    plan_id: id,
    status: string,
  }

  let schema = S.object((s): t => {
    cancelledAt: s.field("cancelledAt", S.null(S.int)),
    claimed: s.field("claimed", S.string),
    
    consumed: s.field("consumed", S.string),
    createdAt: s.field("createdAt", S.int),
    deposited: s.field("deposited", S.string),
    
    id: s.field("id", S.string),
    payer: s.field("payer", S.string),
    plan_id: s.field("plan_id", S.string),
    status: s.field("status", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("plan_id") plan_id: whereOperations<t, id>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "cancelledAt", 
      Integer,
      ~fieldSchema=S.null(S.int),
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "claimed", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "consumed", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "createdAt", 
      Integer,
      ~fieldSchema=S.int,
      
      
      
      
      
      ),
      mkField(
      "deposited", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "payer", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "plan", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      ~linkedEntity="Plan",
      ),
      mkField(
      "status", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkDerivedFromField(
      "claims", 
      ~derivedFromEntity="ClaimEvent",
      ~derivedFromField="stream",
      ),
      mkDerivedFromField(
      "disputes", 
      ~derivedFromEntity="Dispute",
      ~derivedFromField="stream",
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

let userEntities = [
  module(ClaimEvent),
  module(Dispute),
  module(Plan),
  module(Stream),
]->entityModsToInternal

let allEntities =
  userEntities->Js.Array2.concat(
    [module(InternalTable.DynamicContractRegistry)]->entityModsToInternal,
  )

let byName =
  allEntities
  ->Js.Array2.map(entityConfig => {
    (entityConfig.name, entityConfig)
  })
  ->Js.Dict.fromArray
