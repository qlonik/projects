import * as T from "@effect-ts/core/Effect"
import { inspect } from "util"

export const log = <A extends readonly unknown[]>(...args: A) =>
  T.succeedWith(() =>
    console.log(...args.map((a) => inspect(a, { depth: null }))),
  )
