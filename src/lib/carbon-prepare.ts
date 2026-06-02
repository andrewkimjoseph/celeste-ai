import type {
  CarbonPrepareResult,
  CarbonWriteBody,
  FinalizedCarbonPrepareFlow,
} from "@andrewkimjoseph/celina-sdk";
export {
  finalizeCarbonPrepare,
  type FinalizedCarbonPrepareFlow,
} from "@andrewkimjoseph/celina-sdk";

/** @deprecated Use FinalizedCarbonPrepareFlow from celina-sdk */
export type CarbonPreparedFlowResult = FinalizedCarbonPrepareFlow;

export type CarbonPrepareFn = (
  body: CarbonWriteBody,
) => Promise<CarbonPrepareResult>;
