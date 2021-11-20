import * as A from "@effect-ts/core/Collections/Immutable/Array"
import { Package } from "@manypkg/get-packages"
import { StatusResultRenamed } from "simple-git/typings/response"
import { Commit } from "../bindings/parse-commit-message"

export type BaseCommitDescriptor = {
  commit: Commit
  modifiedPackages: A.Array<Package>
}
export type PreviousCommitDescriptor = BaseCommitDescriptor & {
  addedChangesets: A.Array<string>
}
export type CurrentCommitDescriptor = BaseCommitDescriptor & {
  changesets: {
    stagedAdded: A.Array<string>
    stagedDeleted: A.Array<string>
    stagedModified: A.Array<string>
    renamed: A.Array<StatusResultRenamed>
  }
}
