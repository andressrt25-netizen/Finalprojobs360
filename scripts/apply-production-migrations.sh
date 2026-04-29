#!/usr/bin/env sh
set -eu

npx wrangler d1 migrations apply finalprojobs360-db --remote
