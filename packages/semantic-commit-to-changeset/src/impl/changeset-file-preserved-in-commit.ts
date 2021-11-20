import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { pipe } from "@effect-ts/core/Function"
import * as O from "@effect-ts/core/Option"
import { CurrentCommitDescriptor } from "./commit-descriptor"

export const changesetFilePreservedInCommit =
  ({
    stagedModified,
    renamed,
    stagedDeleted,
  }: Omit<CurrentCommitDescriptor["changesets"], "stagedAdded">) =>
  (
    changesetFilePath: string,
  ): O.Option<{ readonly file: string; readonly changed: boolean }> =>
    pipe(
      renamed,
      A.findFirst(({ from }) => from === changesetFilePath),
      O.map(({ to }) => ({ file: to, changed: true })),
      O.alt(() =>
        A.includes_(stagedModified, changesetFilePath)
          ? O.some({ file: changesetFilePath, changed: true })
          : A.includes_(stagedDeleted, changesetFilePath)
          ? O.none
          : O.some({ file: changesetFilePath, changed: false }),
      ),
    )
