import * as L from "@effect-ts/core/Effect/Layer"
import * as O from "@effect-ts/core/Option"
import { constant, flow, pipe } from "@effect-ts/core/Function"
import * as path from "path"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as T from "@effect-ts/core/Effect"
import * as Git from "./bindings/simple-git"
import * as Changesets from "./bindings/changeset-actions"
import { constructChangesetFile } from "./impl/construct-changeset-file"
import { loadCurrentCommitDescriptor } from "./impl/load-current-commit-descriptor"
import { loadPreviousCommitDescriptor } from "./impl/load-previous-commit-descriptor"
import { makeLiveGitActions } from "./bindings/git-actions"
import { getPackages } from "./bindings/get-packages"
import { findIsAmending } from "./impl/find-is-amending"

const dependencies = flow(
  Git.makeLiveSimpleGit,
  L.compose(makeLiveGitActions),
  L.and(Changesets.makeLiveChangesetActions),
)

export const program = pipe(
  T.tuplePar(
    T.succeedWith(() => process.cwd()),
    pipe(
      T.succeedWith(() => process.argv),
      T.map(A.dropLeft(2)),
      T.chain((args) =>
        args.length === 0
          ? T.dieMessage("No arguments passed to the script")
          : T.succeed(args[0]),
      ),
    ),
    pipe(
      findIsAmending,
      T.orElse(constant(T.dieMessage("Could not find parent git command"))),
    ),
  ),

  T.chain(({ tuple: [projectPath, commitMsgPath, isAmending] }) =>
    pipe(
      getPackages(projectPath),

      T.chain((packages) =>
        T.zipPar_(
          isAmending
            ? pipe(loadPreviousCommitDescriptor(packages), T.map(O.some))
            : T.succeed(O.none),

          loadCurrentCommitDescriptor(
            packages,
            path.resolve(projectPath, commitMsgPath),
          ),
        ),
      ),

      T.chain(({ tuple: [previousCommit, currentCommit] }) =>
        constructChangesetFile(projectPath, previousCommit, currentCommit),
      ),

      T.provideLayer(dependencies(projectPath)),
    ),
  ),
)
