  @genType
module DisputeResolver = {
  module DisputeOpened = Types.MakeRegister(Types.DisputeResolver.DisputeOpened)
  module DisputeResponded = Types.MakeRegister(Types.DisputeResolver.DisputeResponded)
  module DisputeSettled = Types.MakeRegister(Types.DisputeResolver.DisputeSettled)
}

  @genType
module PlanRegistry = {
  module PlanCreated = Types.MakeRegister(Types.PlanRegistry.PlanCreated)
  module PlanUpdated = Types.MakeRegister(Types.PlanRegistry.PlanUpdated)
  module PlanDeactivated = Types.MakeRegister(Types.PlanRegistry.PlanDeactivated)
}

  @genType
module StreamManager = {
  module StreamCreated = Types.MakeRegister(Types.StreamManager.StreamCreated)
  module StreamCancelled = Types.MakeRegister(Types.StreamManager.StreamCancelled)
  module StreamToppedUp = Types.MakeRegister(Types.StreamManager.StreamToppedUp)
  module StreamPaused = Types.MakeRegister(Types.StreamManager.StreamPaused)
  module StreamResumed = Types.MakeRegister(Types.StreamManager.StreamResumed)
  module Claimed = Types.MakeRegister(Types.StreamManager.Claimed)
}

@genType /** Register a Block Handler. It'll be called for every block by default. */
let onBlock: (
  Envio.onBlockOptions<Types.chain>,
  Envio.onBlockArgs<Types.handlerContext> => promise<unit>,
) => unit = (
  EventRegister.onBlock: (unknown, Internal.onBlockArgs => promise<unit>) => unit
)->Utils.magic
