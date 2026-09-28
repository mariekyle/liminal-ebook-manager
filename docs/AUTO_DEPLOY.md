# Deploy

Liminal ships as one Docker image in GHCR, `ghcr.io/mariekyle/liminal-ebook-manager`. The host
runs whatever `:stable` points at. Nothing is copied to the host and nothing builds there.
Decisions D-003–D-014.

## The flow

1. Push the commit to `main`. A push without a tag builds nothing.
2. Tag the release and push the tag: `git tag vX.Y.Z && git push origin vX.Y.Z`. The tag must
   match `version=` in `backend/main.py`, the version of record (D-010).
3. **Publish image** runs on the tag.
4. Test the `:vX.Y.Z` build, then run **Promote to stable** by hand. `:stable` is production.
5. On the host, update the app so it pulls `:stable` and restarts.

Docs-only commits get no tag and no image; production stays on the last promoted version.

## Publish image (`.github/workflows/publish.yml`)

Runs on any `v*` tag. In order:

- Rejects a tag that isn't `vX.Y.Z`, or that disagrees with `backend/main.py`.
- Rejects a version that is already in GHCR: a version names one image, once.
- Builds `linux/amd64`, then smoke-tests the built image: it must answer HTTP 200 on
  `/api/health`.
- Pushes `:sha-<short>` and then `:vX.Y.Z`, the exact image that passed.

It never touches `:stable` and never creates a GitHub Release. A red run pushed nothing.

## Promote to stable (`.github/workflows/promote.yml`)

Actions → Promote to stable → Run workflow, with the version **including the `v`**
(`v0.88.1`; `0.88.1` fails the name check). It:

- Checks that `:vX.Y.Z` exists in GHCR. It never builds.
- Copies that manifest to `:stable` and verifies the digests match.
- Creates the GitHub Release for the version, or re-marks an existing one as latest.

## What `:stable` means

`:stable` is the image that is meant to be in production: byte-for-byte a version that passed
the smoke test and that someone chose to promote. It moves only when Promote runs. Publishing a
new version changes nothing in production. The latest GitHub Release always names the version
`:stable` points at.

## The app YAML

The host runs the image from an app definition with this shape. Paths and the user are
placeholders; the real values live only in the host's app config. The tracked
`docker-compose.yml` is the same shape with the paths as required environment variables.

```yaml
services:
  liminal:
    image: ghcr.io/mariekyle/liminal-ebook-manager:stable
    container_name: liminal
    restart: unless-stopped
    pull_policy: always
    user: "<uid>:<gid>"
    ports:
      - "3000:3000"
    environment:
      - BOOKS_PATH=/books
      - BOOKS_DIR=/books
      - DATABASE_PATH=/app/data/library.db
      - COVERS_DIR=/app/data/covers
    volumes:
      - <data path>:/app/data       # library.db + covers/. Local disk, never a network filesystem.
      - <books path>:/books         # the ebook library; writable
      - <backups path>:/backups     # point Settings → Backups at /backups
```

- The container runs as the non-root user in `user:`. That user must be able to write all
  three mounts, so pick a user the storage already allows to write.
- The books root must contain an empty `.liminal-library` file. Without it sync refuses and
  `/api/health` reports the library unreachable (D-008).
- On every start the app snapshots `library.db` through the backup service before migrations
  run (D-009). If the snapshot fails, the app doesn't start.

## Rollback

1. Run **Promote to stable** with the previous version, for example `v0.88.0`. Its release
   exists already, so only the "latest" mark moves.
2. Update the app on the host so it pulls `:stable` again.

A rollback changes the image, not the data. If the newer version ran a migration, the older
image runs against the migrated database; restore the pre-deploy snapshot from the backups
folder if that matters.
