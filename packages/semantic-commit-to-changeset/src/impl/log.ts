import * as T from "@effect-ts/core/Effect"
import { inspect as inspect_ } from "util"

export const inspect = <A extends readonly unknown[]>(...args: A) =>
  T.succeedWith(() =>
    console.log(...args.map((a) => inspect_(a, { depth: null }))),
  )

export const log = <A extends readonly unknown[]>(...args: A) =>
  T.succeedWith(() => console.log(...args))
