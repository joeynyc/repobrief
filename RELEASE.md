# Release Checklist

Use this checklist before publishing a new npm version.

1. Confirm the working tree only contains intended changes.
2. Update `package.json` and `package-lock.json` to the new version.
3. Run `npm run verify`.
4. Run `npm run pack:check`.
5. Install the packed tarball into a temporary project and run:
   - `repobrief --version`
   - `repobrief init`
   - `repobrief update`
   - `repobrief export --format claude`
   - `repobrief export --format cursor`
   - `repobrief export --format codex`
   - `repobrief export --format markdown`
6. Publish with `npm publish`.
7. Confirm `npm view repobrief version` returns the published version.
8. Tag the commit, push the tag, and update the GitHub release notes.
