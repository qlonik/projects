import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"
import { createChangeset } from "./create-changeset"
import { pipe } from "@effect-ts/core/Function"
import { writeChangeset } from "../bindings/changeset-actions"
import path from "path"
import * as Git from "../bindings/git-actions"
import { BaseCommitDescriptor } from "./commit-descriptor"

export const writeChangesetFileIfNeeded = (
  projectPath: string,
  commit: BaseCommitDescriptor["commit"],
  modifiedPackages: BaseCommitDescriptor["modifiedPackages"],
) =>
  O.fold_(
    createChangeset(commit, modifiedPackages),
    () => T.unit,
    (changeset) =>
      pipe(
        writeChangeset(changeset, projectPath),
        T.map((changesetID) =>
          path.resolve(projectPath, ".changeset", `${changesetID}.md`),
        ),
        T.chain(Git.add),
        T.asUnit,
      ),
  )
