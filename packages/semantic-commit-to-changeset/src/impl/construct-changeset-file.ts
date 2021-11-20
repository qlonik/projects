import * as O from "@effect-ts/core/Option"
import { pipe } from "@effect-ts/core/Function"
import * as T from "@effect-ts/core/Effect"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { changesetContentEqual } from "./equal"
import { readFile } from "../bindings/fs"
import { parseChangeset } from "../bindings/changeset-actions"
import * as Git from "../bindings/git-actions"
import {
  CurrentCommitDescriptor,
  PreviousCommitDescriptor,
} from "./commit-descriptor"
import { unifyOption } from "./unify-option"
import { stripIndent } from "common-tags"
import { createChangeset } from "./create-changeset"
import { writeChangesetFileIfNeeded } from "./write-changeset-file-if-needed"
import { addModifiedPackagesFromPreviousCommit } from "./add-modified-packages-from-previous-commit"
import { changesetFilePreservedInCommit } from "./changeset-file-preserved-in-commit"
import { log } from "./log"
import { match } from "ts-pattern"
import { getVersionType } from "./get-version-type"

const currentCommitAddingManyChangesetFilesError = (amount: number) =>
  T.die(stripIndent`
    You are trying to add ${amount} more new changeset files. This is not
    allowed, since there will be more than one changeset file in the resulting
    commit. Either remove all of those changeset files or merge them into one.
  `)
const manyLeftoverChangesetFilesError = (
  nonDeletedChangesetFiles: A.Array<{
    readonly file: string
    readonly changed: boolean
  }>,
) =>
  T.die(stripIndent`
    You are amending a commit containing more than one changeset file. Some of
    those files are removed, but there is still more than one file left. You
    should delete or merge the following files:
      ${A.map_(nonDeletedChangesetFiles, (x) => x.file)}
  `)
const manualChangesetForNonEmittingCommitError = T.die(stripIndent`
  There is a changeset file, even though there should not be one based on the
  message or the set of changed packages in the previous commit. We are assuming
  it was created manually. You are adding one more changeset file. This is not
  allowed, since there will be more than one changeset file in the resulting
  commit. Either remove the previous changeset file or merge both of them into
  one.
`)
const manualChangesetMismatchingCommitMessageError = T.die(stripIndent`
  There is already a changeset file and it does not match the previous commit
  message. We are assuming it was created manually. You are adding one more
  changeset file. This is not allowed, since there will be more than one
  changeset file in the resulting commit. Either remove the previous changeset
  file or merge both of them into one.
`)
const keepExistingManualChangesetFileWarning = log(stripIndent`
  There is already a changeset file and it does not match the previous commit
  message. We are assuming it was created manually. Therefore, we are going to
  keep it and the extra changeset file from the current commit will not be 
  generated. If the previous changeset file is outdated, and you want the new
  changeset file to be generated, delete the previous changeset file.
`)

const manualChangesetNoPkgOrCommitWarning = log(stripIndent`
  We are adding manually added changeset file, even though no packages were
  modified and the commit message implies there should not be any changeset
  files associated with it.
`)
const manualChangesetNoCommitWarning = log(stripIndent`
  We are adding manually added changeset file, even though the commit message
  implies there should not be any changeset files associated with it.
`)
const manualChangesetNoPkgWarning = log(stripIndent`
  We are adding manually added changeset file, even though no packages were
  modified.
`)

const constructAction = (
  prevCommitO: O.Option<PreviousCommitDescriptor>,
  prevModifiedChangesets: Omit<
    CurrentCommitDescriptor["changesets"],
    "stagedAdded"
  >,
  maybeNewChangesetFilePath: O.Option<string>,
) =>
  pipe(
    T.do,

    T.bind("prevCommit", () =>
      T.fromOption(
        // if we want to print any warnings about ongoing amend, we will not be
        // able to distinguish between a new commit being created and a commit
        // without changesets being amended, since we are chaining two of these
        // separate states
        O.chain_(
          prevCommitO,
          O.fromPredicate((_) => A.isNonEmpty(_.addedChangesets)),
        ),
      ),
    ),

    T.bind("leftover", ({ prevCommit: { addedChangesets } }) =>
      pipe(
        addedChangesets,
        A.filterMap(changesetFilePreservedInCommit(prevModifiedChangesets)),
        (preservedChangesetFiles) =>
          preservedChangesetFiles.length > 1
            ? manyLeftoverChangesetFilesError(preservedChangesetFiles)
            : // if all changeset files from the previous commit got deleted in
              // the current commit, we either need to generate changeset file
              // for a current commit or generate a bunch of warnings. Both of
              // these are handled by the generation function
              T.fromOption(A.head(preservedChangesetFiles)),
      ),
    ),

    T.let(
      "maybeRegeneratedChangeset",
      ({ prevCommit: { commit, modifiedPackages } }) =>
        createChangeset(commit, modifiedPackages),
    ),

    T.bind("currentChangesetFromFile", ({ leftover: { file } }) =>
      pipe(
        readFile(file, "utf-8"),
        T.chain(parseChangeset),
        T.mapError(O.some),
      ),
    ),

    T.chain(
      ({
        // changeset object generated from previous commit data
        maybeRegeneratedChangeset,

        // only one changeset file is left. we need to validate that it is
        // modified appropriately
        leftover: { file: currentChangesetFilePath },
        // loaded and parsed content of the last remaining changeset file
        currentChangesetFromFile,
      }) =>
        pipe(
          maybeRegeneratedChangeset,
          O.chain(
            O.fromPredicate((regeneratedChangeset) =>
              changesetContentEqual.equals(
                regeneratedChangeset,
                currentChangesetFromFile,
              ),
            ),
          ),
          O.fold(
            () =>
              O.isSome(maybeNewChangesetFilePath)
                ? // deal with simplified "# section 4"
                  O.isNone(maybeRegeneratedChangeset)
                  ? manualChangesetForNonEmittingCommitError
                  : manualChangesetMismatchingCommitMessageError
                : // deal with simplified "# section 2"
                  keepExistingManualChangesetFileWarning,
            () =>
              // the changeset file content is equal to the previous commit
              // message, so we should remove old changeset file and generate
              // the new one if needed
              pipe(
                Git.rm(currentChangesetFilePath),
                T.mapError(O.some),
                T.zipRight(T.fail(O.none)),
              ),
          ),
        ),
    ),

    T.mapError(unifyOption),
  )

export const constructChangesetFile = (
  projectPath: string,
  // the previous commit is present when we are amending
  prevCommitO: O.Option<PreviousCommitDescriptor>,
  {
    commit,
    modifiedPackages,
    changesets: { stagedAdded, ...prevModifiedChangesets },
  }: CurrentCommitDescriptor,
) => {
  // current commit adds more than one new changeset files
  if (stagedAdded.length > 1) {
    return currentCommitAddingManyChangesetFilesError(stagedAdded.length)
  }

  // current commit either added new changeset file or not
  // REMARK: should the content of the added changeset be used for something?
  const maybeNewChangesetFilePath = A.head(stagedAdded)

  return pipe(
    constructAction(
      prevCommitO,
      prevModifiedChangesets,
      maybeNewChangesetFilePath,
    ),

    T.catchAll(
      T.unionFn(
        O.fold(() => {
          const pkgs = addModifiedPackagesFromPreviousCommit(
            prevCommitO,
            modifiedPackages,
          )

          if (O.isSome(maybeNewChangesetFilePath)) {
            return match([
              O.isSome(getVersionType(commit)),
              A.isNonEmpty(pkgs),
            ] as const)
              .with([false, false], () => manualChangesetNoPkgOrCommitWarning)
              .with([false, true], () => manualChangesetNoCommitWarning)
              .with([true, false], () => manualChangesetNoPkgWarning)
              .with([true, true], () => /* potential improvement */ T.unit)
              .exhaustive()
          }

          return writeChangesetFileIfNeeded(projectPath, commit, pkgs)
        }, T.fail),
      ),
    ),
  )
}
