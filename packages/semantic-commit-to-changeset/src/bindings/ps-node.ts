import { lookup as lookup_, Program, Query } from "ps-node"
import * as T from "@effect-ts/core/Effect"
import * as A from "@effect-ts/core/Collections/Immutable/Array"

export const lookup: (
  query: Query,
) => T.Effect<unknown, Error, A.Array<Program & { ppid: number }>> =
  T.fromNodeCb(lookup_) as any
