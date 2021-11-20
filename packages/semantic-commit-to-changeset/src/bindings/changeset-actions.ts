import { Changeset } from "@changesets/types"
import { Tagged } from "@effect-ts/core/Case"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import writeChangeset_ from "@changesets/write"
import parseChangeset_ from "@changesets/parse"
import { tag } from "@effect-ts/core/Has"
import { _A } from "@effect-ts/core/Utils"

export class WriteChangesetError extends Tagged("write-changeset-error")<{
  readonly error: unknown
}> {}

export class ParseChangesetError extends Tagged("parse-changeset-error")<{
  readonly error: unknown
}> {}

const changesetActions = T.succeed({
  _tag: "changeset-actions" as const,
  write: (changeset: Changeset, projectPath: string) =>
    T.tryCatchPromise(
      () => writeChangeset_(changeset, projectPath),
      (error) => new WriteChangesetError({ error }),
    ),

  parse: (content: string) =>
    T.tryCatch(
      () => parseChangeset_(content),
      (error) => new ParseChangesetError({ error }),
    ),
})

export interface ChangesetActions extends _A<typeof changesetActions> {}
export const ChangesetActionsTag = tag<ChangesetActions>()
export const makeLiveChangesetActions =
  L.fromEffect(ChangesetActionsTag)(changesetActions)

export const { write: writeChangeset, parse: parseChangeset } = T.deriveLifted(
  ChangesetActionsTag,
)(["write", "parse"], [], [])
