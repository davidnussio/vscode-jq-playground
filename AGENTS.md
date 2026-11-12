# Agent notes

## Vendored library sources (`repos/`)

`repos/` contains read-only copies of upstream library sources, vendored with
`git subtree` so agents can read real implementations, tests and docs.

- `repos/effect` — Effect v4 monorepo (matches the `effect` version in
  `package.json`). Start from `repos/effect/LLMS.md`,
  `repos/effect/MIGRATION.md`, `repos/effect/migration/` and
  `repos/effect/packages/effect/src/` (HTTP client: `src/http/`).

Rules:

- Treat `repos/**` as reference material only: never edit it and never import
  from it. Application code imports from the `effect` npm package.
- When an Effect API is unclear, read the source and tests in `repos/effect`
  before guessing. It is authoritative over `effect-ts-llms.md` (Effect v3
  docs) and over the `effect-ts` skill, which may describe older v4 betas
  (e.g. `ServiceMap`, `effect/unstable/*`).

Updating (keep it in sync with the `effect` version in `package.json`):

```bash
git fetch --depth 1 https://github.com/Effect-TS/effect.git 'refs/tags/effect@<version>'
git subtree merge --prefix repos/effect FETCH_HEAD --squash -m "chore: update vendored Effect to <version>"
```
