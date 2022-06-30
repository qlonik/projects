import { lookup } from "../bindings/ps-node"
import * as T from "@effect-ts/core/Effect"
import { pipe } from "@effect-ts/core/Function"
import { Program } from "ps-node"

const findUpRecursive = (matches: (proc: Program) => boolean) =>
  function go(pid: number): T.IO<Error, Program> {
    return pipe(
      lookup({ pid }),
      T.chain((list) =>
        list.length !== 1
          ? T.fail(new Error("Found list is not of length 1"))
          : T.succeed(list[0]),
      ),
      T.chain((proc) =>
        matches(proc) ? T.succeed(proc) : T.suspend(() => go(proc.ppid)),
      ),
    )
  }

export const findIsAmending = pipe(
  T.succeedWith(() => process.pid),
  T.chain(
    findUpRecursive(
      (proc) => proc.command === "git" || proc.command.endsWith("/bin/git"),
    ),
  ),
  T.map((proc) => proc.arguments.includes("--amend")),
)
