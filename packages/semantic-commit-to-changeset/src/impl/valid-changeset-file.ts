import { pipe } from "@effect-ts/core/Function"
import path from "path"

export const validChangesetFile = (filepath: string) =>
  filepath.startsWith(".changeset") &&
  pipe(
    path.basename(filepath),
    (basefile) =>
      !basefile.startsWith(".") &&
      basefile.endsWith(".md") &&
      basefile !== "README.md",
  )
