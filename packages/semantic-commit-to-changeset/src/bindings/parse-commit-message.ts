import { Tagged } from "@effect-ts/core/Case"
import * as T from "@effect-ts/core/Effect"
import {
  Commit as ConventionalCommit,
  sync as parseConventionalCommit,
} from "conventional-commits-parser"
import * as A from "@effect-ts/core/Collections/Immutable/Array"

export class ParseConventionalCommitError extends Tagged(
  "parse-conventional-commit-error",
)<{ readonly error: unknown }> {}

/** copy of {@see ConventionalCommit.CommitBase} interface */
export interface Commit {
  readonly merge: ConventionalCommit.Field
  readonly revert: ConventionalCommit.Revert | null

  readonly header: ConventionalCommit.Field
  readonly body: ConventionalCommit.Field
  readonly footer: ConventionalCommit.Field

  readonly type?: ConventionalCommit.Field | undefined
  readonly scope?: ConventionalCommit.Field | undefined
  readonly subject?: ConventionalCommit.Field | undefined

  readonly notes: A.Array<ConventionalCommit.Note>
  readonly references: A.Array<ConventionalCommit.Reference>
  readonly mentions: A.Array<string>
}

export const parseCommitMessage = (
  commitMsg: string,
): T.IO<ParseConventionalCommitError, Commit & { raw: string }> =>
  T.tryCatch(
    () => Object.assign(parseConventionalCommit(commitMsg), { raw: commitMsg }),
    (error) => new ParseConventionalCommitError({ error }),
  )
