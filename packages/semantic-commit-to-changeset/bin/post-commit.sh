#!/usr/bin/env sh

# if some staged changes are present in .changeset folder
git diff-index --cached --quiet HEAD -- .changeset || \
  # commit them
  git commit -q --amend --no-verify -C HEAD .changeset
