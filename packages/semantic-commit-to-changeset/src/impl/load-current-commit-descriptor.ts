import { Packages } from "@manypkg/get-packages"
import { pipe } from "@effect-ts/core/Function"
import * as T from "@effect-ts/core/Effect"
import * as Git from "../bindings/git-actions"
import { readFile } from "../bindings/fs"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { CurrentCommitDescriptor } from "./commit-descriptor"
import { parseCommitMessage } from "../bindings/parse-commit-message"
import { validChangesetFile } from "./valid-changeset-file"
import { isStagedChangeset } from "./is-staged-changeset"
import { findChangedPackages } from "./find-changed-packages"

export const loadCurrentCommitDescriptor = (
  packages: Packages,
  fullCommitMsgPath: string,
) =>
  pipe(
    readFile(fullCommitMsgPath, "utf-8"),
    T.chain(parseCommitMessage),
    T.zipPar(Git.status),
    T.map(
      ({ tuple: [commit, gitStatus] }): CurrentCommitDescriptor => ({
        commit,

        changesets: pipe(isStagedChangeset(gitStatus.staged), (isStaged) => ({
          stagedAdded: A.concat_(
            A.filter_(gitStatus.created, isStaged),
            [],
            // TODO: replace empty arr with the following later
            // A.filterMap_(gitStatus.renamed, ({ from, to }) =>
            //   !validChangesetFile(from) && validChangesetFile(to)
            //     ? O.some(to)
            //     : O.none,
            // ),
          ),
          stagedDeleted: A.concat_(
            A.filter_(gitStatus.deleted, isStaged),
            [],
            // TODO: replace empty arr with the following later
            // A.filterMap_(gitStatus.renamed, ({ from, to }) =>
            //   validChangesetFile(from) && !validChangesetFile(to)
            //     ? O.some(from)
            //     : O.none,
            // ),
          ),
          stagedModified: A.filter_(gitStatus.modified, isStaged),
          renamed: A.filter_(
            gitStatus.renamed,
            ({ from, to }) =>
              validChangesetFile(from) && validChangesetFile(to),
          ),
        })),

        modifiedPackages: pipe(
          gitStatus.renamed,
          A.chain((x) => [x.from, x.to]),
          A.concat(gitStatus.staged),
          findChangedPackages(packages),
        ),
      }),
    ),
  )
