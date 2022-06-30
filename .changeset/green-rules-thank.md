---
"@qlonik/semantic-commit-to-changeset": patch
---

add static bin file loading compiled bin

This fixes the issue, when the package is used locally, where pnpm could
not link the binary file that does not exist, since the package was not
built yet.
