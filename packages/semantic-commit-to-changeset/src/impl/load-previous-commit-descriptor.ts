import { Packages } from "@manypkg/get-packages"
import { pipe } from "@effect-ts/core/Function"
import * as T from "@effect-ts/core/Effect"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import * as O from "@effect-ts/core/Option"
import { PreviousCommitDescriptor } from "./commit-descriptor"
import * as Git from "../bindings/git-actions"
import { Tagged } from "@effect-ts/core/Case"
import { parseCommitMessage } from "../bindings/parse-commit-message"
import { validChangesetFile } from "./valid-changeset-file"
import { findChangedPackages } from "./find-changed-packages"

export class MissingLatestCommitError extends Tagged(
  "missing-latest-commit-error",
)<{}> {}

export const loadPreviousCommitDescriptor = (packages: Packages) =>
  pipe(
    Git.log({
      from: "HEAD^",
      to: "HEAD",
      multiLine: true,
      maxCount: 1,
      ...{ "--stat": true },
    }),
    T.map((logResult) => logResult.latest),
    T.chain(
      T.fromPredicate(
        (x): x is NonNullable<typeof x> => x != null,
        () => new MissingLatestCommitError(),
      ),
    ),

    T.chain((latest) =>
      T.structPar({
        commit: parseCommitMessage(latest.body),
        modifiedPackages: pipe(
          latest.diff?.files ?? [],
          A.map((x) => x.file),
          findChangedPackages(packages),
          T.succeed,
        ),
        addedChangesets: pipe(
          Git.log({
            from: "HEAD^",
            to: "HEAD",
            maxCount: 1,
            ...{ "--stat": true, "--diff-filter": "A" },
          }),
          T.map(
            (log) =>
              // with `--diff-filter=A` option, if no files were added,
              // the entire commit will not show up
              log.latest?.diff?.files ?? [],
          ),
          T.map(
            A.filterMap(({ binary, file }) =>
              !binary && validChangesetFile(file) ? O.some(file) : O.none,
            ),
          ),
        ),
      }),
    ),

    T.map((x): PreviousCommitDescriptor => x),
  )
