# @qlonik/semantic-commit-to-changeset

## 0.2.0

### Minor Changes

- 1855ad5: add bin for post-commit hook to package
- cea8610: determine commit amending status in package
- ece3c28: rename bin file for commit-msg hook

### Patch Changes

- 18b12f0: add static bin file loading compiled bin

  This fixes the issue, when the package is used locally, where pnpm could
  not link the binary file that does not exist, since the package was not
  built yet.

- 1e585a3: exclude inspect from regular log method

  This way messages printed by the script to console do not have weird
  line breaks within them.

## 0.1.0

### Minor Changes

- 3647811: implement commit-converter plugin

  commit-converter actually generates changeset files now
