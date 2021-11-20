import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as Equal from "@effect-ts/core/Equal"
import { validChangesetFile } from "./valid-changeset-file"

export const isStagedChangeset = (staged: string[]) => {
  const stagedChangesets = A.filter_(staged, validChangesetFile)
  const inStrArr = A.elem_(Equal.string)
  return (x: string) => inStrArr(stagedChangesets, x)
}
