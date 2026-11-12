# Agent notes

## Local library sources (`repos/`)

`repos/` holds read-only copies of upstream library sources so agents can read
real implementations, tests and docs. It is git-ignored: the copies live only
on your machine and are never committed.

- `repos/effect` — Effect v4 monorepo (matches the `effect` version in
  `package.json`). Start from `repos/effect/LLMS.md`,
  `repos/effect/MIGRATION.md`, `repos/effect/migration/` and
  `repos/effect/packages/effect/src/` (HTTP client: `src/http/`).

Rules:

- Treat `repos/**` as reference material only: never edit it, never import
  from it and never commit it. Application code imports from the `effect` npm
  package.
- When an Effect API is unclear, read the source and tests in `repos/effect`
  before guessing. It is authoritative over the `effect-ts` skill, which may describe older v4 betas
  (e.g. `ServiceMap`, `effect/unstable/*`).
- If `repos/effect` is missing, fetch it with the command below.

Fetching or updating (keep it in sync with the `effect` version in
`package.json`):

```bash
rm -rf repos/effect && git clone --depth 1 --branch 'effect@<version>' https://github.com/Effect-TS/effect.git repos/effect && rm -rf repos/effect/.git
```
