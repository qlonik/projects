import { pipe } from "@effect-ts/core/Function"
import * as Equal from "@effect-ts/core/Equal"
import { Changeset, Release, VersionType } from "@changesets/types"
import * as Ord from "@effect-ts/core/Ord"
import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { Package } from "@manypkg/get-packages"

const tupleOrd = <A extends ReadonlyArray<unknown>>(
  ...ords: { [K in keyof A]: Ord.Ord<A[K]> }
): Ord.Ord<Readonly<A>> =>
  Ord.makeOrd((first, second) => {
    let i = 0
    for (; i < ords.length - 1; i++) {
      const r = ords[i].compare(first[i], second[i])
      if (r !== 0) {
        return r
      }
    }
    return ords[i].compare(first[i], second[i])
  })

const ReleaseOrd = pipe(
  tupleOrd(Ord.string, Ord.string as Ord.Ord<VersionType>),
  Ord.contramap(({ name, type }: Release) => [name, type] as const),
)

export const changesetContentEqual = Equal.struct<Changeset>({
  summary: Equal.string,
  releases: pipe(
    Equal.array(Ord.getEqual(ReleaseOrd)),
    Equal.contramap(A.sort(ReleaseOrd)),
  ),
})

export const packageEqual = pipe(
  Equal.string,
  Equal.contramap((x: Package) => x.packageJson.name),
)
