import { Commit } from "../bindings/parse-commit-message"
import * as O from "@effect-ts/core/Option"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { Package } from "@manypkg/get-packages"
import { Changeset } from "@changesets/types"
import { pipe } from "@effect-ts/core/Function"
import { Commit as ConventionalCommit } from "conventional-commits-parser"
import { getVersionType } from "./get-version-type"

const nonEmptyString = O.fromPredicate(
  (x: string | null | undefined): x is string => x != null && x.length > 0,
)

const rebuildCommitString = (parts: ConventionalCommit.Field[]) =>
  pipe(parts, A.filterMap(nonEmptyString), (x) => x.join("\n\n"))

const getNewHeaderLine = (commit: Commit) => {
  const scope = nonEmptyString(commit.scope)
  const subject = nonEmptyString(commit.subject)
  return O.fold_(
    scope,
    () => O.getOrElse_(subject, () => ""),
    (scope) =>
      O.fold_(
        subject,
        () => scope,
        (subject) => `${scope}: ${subject}`,
      ),
  )
}

const reformatCommitMsg = (commit: Commit) =>
  rebuildCommitString([getNewHeaderLine(commit), commit.body, commit.footer])

export const createChangeset = (
  commit: Commit,
  modifiedPackages: A.Array<Package>,
): O.Option<Changeset> =>
  pipe(
    O.do,
    O.bind("commit", () =>
      pipe(
        commit,
        O.fromPredicate((commit) => !commit.merge && !commit.revert),
      ),
    ),
    O.bind("modifiedPackages", () =>
      pipe(modifiedPackages, O.fromPredicate(A.isNonEmpty)),
    ),
    O.bind("type", ({ commit }) => getVersionType(commit)),
    O.let("summary", ({ commit }) => reformatCommitMsg(commit)),
    O.let("releases", ({ modifiedPackages, type }) =>
      pipe(
        modifiedPackages,
        A.map(({ packageJson: { name } }) => ({ name, type })),
        A.toMutable,
      ),
    ),
    O.map(({ summary, releases }) => ({ summary, releases })),
  )
