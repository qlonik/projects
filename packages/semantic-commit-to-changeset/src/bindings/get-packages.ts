import * as T from "@effect-ts/core/Effect"
import { getPackages as getPackages_ } from "@manypkg/get-packages"
import { Tagged } from "@effect-ts/core/Case"

export class GetPackagesError extends Tagged("get-packages-error")<{
  readonly error: unknown
}> {}

export function getPackages(projectPath: string) {
  return T.tryCatchPromise(
    () => getPackages_(projectPath),
    (error) => new GetPackagesError({ error }),
  )
}
