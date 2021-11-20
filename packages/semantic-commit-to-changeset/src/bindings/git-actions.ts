import * as T from "@effect-ts/core/Effect"
import { flow, pipe } from "@effect-ts/core/Function"
import * as L from "@effect-ts/core/Effect/Layer"
import { tag } from "@effect-ts/core/Has"
import { Tagged } from "@effect-ts/core/Case"
import { GitError as BaseGitError } from "simple-git"
import * as types from "simple-git/typings/types"
import { _A } from "@effect-ts/core/Utils"
import { SimpleGitServiceTag } from "./simple-git"

export class GitError extends Tagged("git-error")<{
  readonly error: BaseGitError
}> {}

const gitActions = T.accessService(SimpleGitServiceTag)((git) => ({
  _tag: "git-actions",
  status: pipe(
    T.fromNodeCb(git.status.bind(git))(),
    T.mapError((error) => new GitError({ error })),
  ),
  log: flow(
    T.fromNodeCb(git.log.bind(git)),
    T.mapError((error) => new GitError({ error })),
  ),
  add: flow(
    T.fromNodeCb(git.add.bind(git)),
    T.mapError((error) => new GitError({ error })),
  ),
  rm: flow(
    T.fromNodeCb(git.rm.bind(git)),
    T.mapError((error) => new GitError({ error })),
  ),
}))

export interface GitActions extends _A<typeof gitActions> {}
export const GitActionsTag = tag<GitActions>()
export const makeLiveGitActions = L.fromEffect(GitActionsTag)(gitActions)

export const { status, add, rm } = T.deriveLifted(GitActionsTag)(
  ["add", "rm"],
  ["status"],
  [],
)

export const log = <T = types.DefaultLogFields>(
  options?: types.TaskOptions | types.LogOptions<T>,
) => T.accessServiceM(GitActionsTag)((git) => git.log(options))
