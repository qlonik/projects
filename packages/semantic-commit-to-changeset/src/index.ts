import * as L from "@effect-ts/core/Effect/Layer"
import * as O from "@effect-ts/core/Option"
import { flow, pipe } from "@effect-ts/core/Function"
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

const dependencies = flow(
  Git.makeLiveSimpleGit,
  L.compose(makeLiveGitActions),
  L.and(Changesets.makeLiveChangesetActions),
)

export const program = pipe(
  T.succeedWith(() => process.cwd()),
  T.zipPar(
    pipe(
      T.succeedWith(() => process.argv),
      T.map(A.dropLeft(2)),
      T.chain(([commitMsgPath, isAmending]) =>
        isAmending === "true" || isAmending === "false"
          ? T.succeed({ commitMsgPath, isAmending: isAmending === "true" })
          : T.dieMessage("Incorrect value of isAmending parameter"),
      ),
    ),
  ),

  T.chain(({ tuple: [projectPath, { commitMsgPath, isAmending }] }) =>
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
