import { VersionType } from "@changesets/types"
import { pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { Commit } from "../bindings/parse-commit-message"

export const getVersionType = (commit: Commit): O.Option<VersionType> =>
  commit.notes.some((x) => x.title === "BREAKING CHANGE")
    ? O.some("major")
    : pipe(commit.type?.toLowerCase(), (type) =>
        type === "feat"
          ? O.some("minor")
          : type === "fix"
          ? O.some("patch")
          : O.none,
      )
