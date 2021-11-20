import * as O from "@effect-ts/core/Option"
import { pipe } from "@effect-ts/core/Function"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { packageEqual } from "./equal"
import {
  CurrentCommitDescriptor,
  PreviousCommitDescriptor,
} from "./commit-descriptor"

export const addModifiedPackagesFromPreviousCommit = (
  prevCommitO: O.Option<PreviousCommitDescriptor>,
  modifiedPackages: CurrentCommitDescriptor["modifiedPackages"],
): CurrentCommitDescriptor["modifiedPackages"] =>
  pipe(
    prevCommitO,
    O.map((x) => x.modifiedPackages),
    O.getOrElse(() => A.empty),
    A.concat(modifiedPackages),
    A.uniq(packageEqual),
  )
