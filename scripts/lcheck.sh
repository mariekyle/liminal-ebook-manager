#!/bin/sh
# scripts/lcheck.sh — copy the deployable files from this repo to the NAS docker volume,
# or show what would change. Replaces the old `lcheck` (CLAUDE.md, "Build, version, deploy").
#
#   scripts/lcheck.sh            dry run: itemize every file that differs (default)
#   scripts/lcheck.sh --apply    copy, then re-run the dry run; exit 1 if anything still differs
#
# Needs LIMINAL_VOLUME in the environment: the mounted volume directory, which must contain
# docker-compose.yml. No host path lives in this file; the value is in CLAUDE.local.md.
#
# Scope (repo-relative). frontend/src/ and backend/ are mirrored with --delete, so a file
# removed from the repo is removed from the volume too. Everything else is copied one way and
# never deleted. Compared by checksum, not mtime: SMB mounts don't always keep mtimes.
#   frontend/src/  backend/  frontend/public/        (mirrored)
#   Dockerfile  frontend/package.json  frontend/package-lock.json  frontend/vite.config.js
#   frontend/tailwind.config.js  frontend/postcss.config.js  frontend/index.html
#   CHANGELOG.md  ROADMAP.md                          (copied, never deleted)
# Never copied: node_modules, __pycache__, *.pyc, data/, .env, .DS_Store.

set -u
cd "$(dirname "$0")/.." || exit 2

mode=check
case "${1:-}" in
  "")        ;;
  --apply)   mode=apply ;;
  -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
  *)         echo "lcheck: unknown option '$1' (use --apply or nothing)" >&2; exit 2 ;;
esac

if [ -z "${LIMINAL_VOLUME:-}" ]; then
  echo "lcheck: LIMINAL_VOLUME is not set. Export it in ~/.zshrc (value in CLAUDE.local.md)." >&2
  exit 2
fi
if [ ! -d "$LIMINAL_VOLUME" ]; then
  echo "lcheck: LIMINAL_VOLUME=$LIMINAL_VOLUME is not a directory. Is the share mounted?" >&2
  exit 2
fi
if [ ! -f "$LIMINAL_VOLUME/docker-compose.yml" ]; then
  echo "lcheck: $LIMINAL_VOLUME has no docker-compose.yml, so it is not the Liminal volume. Refusing." >&2
  exit 2
fi

# Note: backend/requirements.txt is inside the mirrored backend/ tree; the Dockerfile reads it there.
MIRRORED="frontend/src backend frontend/public"
COPIED="Dockerfile frontend/package.json frontend/package-lock.json frontend/vite.config.js
frontend/tailwind.config.js frontend/postcss.config.js frontend/index.html CHANGELOG.md ROADMAP.md"

EXCLUDES="--exclude=node_modules --exclude=__pycache__ --exclude=*.pyc --exclude=data \
--exclude=.env --exclude=.DS_Store"

# -r recurse, -l links as links, -c compare by checksum, -i itemize. No -t/-p: SMB owns those.
# One shot per tree so --delete never reaches outside the mirrored trees.
run() {   # $1 = "" or --dry-run
  for d in $MIRRORED; do
    rsync -rlci --delete $1 $EXCLUDES "$d/" "$LIMINAL_VOLUME/$d/" || return 1
  done
  # shellcheck disable=SC2086
  rsync -rlci --relative $1 $EXCLUDES $COPIED "$LIMINAL_VOLUME/" || return 1
}

# Lines that are attribute-only ('.f' / '.d' with no content change) are not differences.
differences() { grep -Ev '^\.[df]' ; }

if [ "$mode" = check ]; then
  out=$(run --dry-run) || { echo "lcheck: rsync failed" >&2; exit 1; }
  diffs=$(printf '%s\n' "$out" | differences | sed '/^$/d')
  if [ -z "$diffs" ]; then
    echo "✓ volume matches the repo ($LIMINAL_VOLUME)"; exit 0
  fi
  echo "would change ($LIMINAL_VOLUME) — '>f' copy, '*deleting' remove, 'cd' new dir:"
  printf '%s\n' "$diffs" | sed 's/^/  /'
  echo "run with --apply to copy"
  exit 0
fi

echo "copying to $LIMINAL_VOLUME"
run "" | differences | sed '/^$/d; s/^/  /'
echo "verifying"
out=$(run --dry-run) || { echo "lcheck: verify rsync failed" >&2; exit 1; }
diffs=$(printf '%s\n' "$out" | differences | sed '/^$/d')
if [ -n "$diffs" ]; then
  echo "✗ still differs after copy — do not rebuild:" >&2
  printf '%s\n' "$diffs" | sed 's/^/  /' >&2
  exit 1
fi
echo "✓ volume matches the repo — safe to rebuild in Container Manager"
