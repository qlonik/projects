import { Package, Packages } from "@manypkg/get-packages"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { strict } from "@effect-ts/core/Equal"
import { pipe } from "@effect-ts/core/Function"
import isSubdir from "is-subdir"
import * as Ord from "@effect-ts/core/Ord"

const deepestPackagePathOrd = pipe(
  Ord.number,
  Ord.inverted,
  Ord.contramap((pkg: Package) => pkg.dir.length),
)

export const findChangedPackages =
  ({ packages }: Packages) =>
  (changedFiles: A.Array<string>): A.Array<Package> =>
    pipe(
      changedFiles,
      A.filterMap((filename) =>
        pipe(
          packages,
          A.filter(({ dir }) => dir !== "" && isSubdir(dir, filename)),
          A.sort(deepestPackagePathOrd),
          A.head,
        ),
      ),
      A.uniq(strict()),
    )
