import { Tagged } from "@effect-ts/core/Case"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import { tag } from "@effect-ts/core/Has"
import simpleGit, {
  GitConstructError as BaseGitConstructError,
  SimpleGit,
} from "simple-git"

export class SimpleGitConstructionError extends Tagged(
  "git-construction-error",
)<{
  readonly error: BaseGitConstructError
}> {}

export const SimpleGitServiceTag = tag<SimpleGit>()
export const makeLiveSimpleGit = (project: string) =>
  L.fromEffect(SimpleGitServiceTag)(
    T.tryCatch(
      () =>
        simpleGit(project, {
          config: ["color.diff=false", "color.status=false", "color.log=false"],
        }),
      (error) =>
        new SimpleGitConstructionError({
          error: error as BaseGitConstructError,
        }),
    ),
  )
