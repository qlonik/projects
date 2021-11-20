import { Tagged } from "@effect-ts/core/Case"
import * as T from "@effect-ts/core/Effect"
import * as fs from "fs"
import { ObjectEncodingOptions, PathOrFileDescriptor } from "fs"

export class NodeError extends Tagged("node-error")<{
  readonly error: NodeJS.ErrnoException
}> {}

export function readFile(
  path: PathOrFileDescriptor,
  options:
    | { encoding?: null | undefined; flag?: string | undefined }
    | undefined
    | null,
): T.IO<NodeError, Buffer>
export function readFile(
  path: PathOrFileDescriptor,
  options:
    | { encoding: BufferEncoding; flag?: string | undefined }
    | BufferEncoding,
): T.IO<NodeError, string>
export function readFile(
  path: PathOrFileDescriptor,
  options:
    | (ObjectEncodingOptions & { flag?: string | undefined })
    | BufferEncoding
    | undefined
    | null,
): T.IO<NodeError, string | Buffer>
export function readFile(path: PathOrFileDescriptor): T.IO<NodeError, Buffer>

export function readFile(
  path: PathOrFileDescriptor,
  options?: object | BufferEncoding | null | undefined,
): T.IO<NodeError, string | Buffer> {
  return T.effectAsyncInterrupt<unknown, NodeError, string | Buffer>((cb) => {
    const ac = new AbortController()

    fs.readFile(
      path,
      options == null || typeof options === "string"
        ? { encoding: options, signal: ac.signal }
        : { ...options, signal: ac.signal },
      (error, data) =>
        error ? cb(T.fail(new NodeError({ error }))) : cb(T.succeed(data)),
    )

    return T.succeedWith(() => ac.abort())
  })
}
