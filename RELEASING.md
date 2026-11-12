# Releasing

## Prerequisites

- [pnpm](https://pnpm.io/) installed
- A [Visual Studio Marketplace](https://marketplace.visualstudio.com/) publisher account (`davidnussio`)
- An [Open VSX Registry](https://open-vsx.org/) account with a valid token
- Logged in via `vsce login davidnussio`

## Manual Release (local)

> `vsce login` needs an Azure DevOps global PAT, a token type retired on
> December 1, 2026. Prefer the automated release below.

```bash
# 1. Login to the VS Marketplace (one-time)
vsce login davidnussio

# 2. Build the .vsix package
pnpm dlx @vscode/vsce package --no-dependencies <version>

# 3. Publish to Open VSX Registry
pnpm dlx ovsx publish vscode-jq-playground-<version>.vsix -p <OVSX_TOKEN>

# 4. Publish to VS Marketplace
pnpm dlx @vscode/vsce publish --no-dependencies <version>
```

Replace `<version>` with the target version (e.g. `5.0.5`) and `<OVSX_TOKEN>` with your Open VSX token.

## Automated Release (GitHub Actions)

Two workflows live in `.github/workflows`:

- `ci.yml` — on every pull request and push to `main`: unit tests, type check,
  lint and a test `.vsix` build (uploaded as a workflow artifact).
- `release.yml` — builds one `.vsix` from a tag and publishes it to the
  VS Marketplace and to the Open VSX Registry (used by Kiro, Cursor, VSCodium,
  Windsurf, …) in two independent jobs.

### Creating a release

1. Bump `version` in `package.json`, update `CHANGELOG.md` and merge to `main`
2. Tag that commit `v<version>` (e.g. `v6.0.1`) and push the tag
3. Go to **Releases → Draft a new release** on GitHub and pick the tag
4. Check **Set as a pre-release** if applicable
5. Click **Publish release**

Or from the terminal:

```bash
gh release create v<version> --generate-notes
```

The workflow will:

- Fail early if the tag does not match the `package.json` version
- Run the unit tests, then build and package the extension (`--pre-release`
  is applied automatically for pre-releases)
- Publish the same `.vsix` to the VS Marketplace and to Open VSX
- Upload the `.vsix` to the GitHub Release

### Re-running or publishing an existing tag

`release.yml` can also be started manually (**Actions → Release Extension →
Run workflow**), choosing the tag and the target (`both`, `marketplace` or
`openvsx`). Publishing is idempotent: a version that already exists on a
registry is skipped, so a failed job can simply be re-run.

```bash
gh workflow run release.yml -f tag=v<version> -f target=both
```

### Credentials

**VS Marketplace — Trusted Publishing (no secret).** The workflow authenticates
with GitHub OIDC (`vsce publish --oidc`). Azure DevOps global PATs, which
`VSCE_PAT` relied on, are retired on December 1, 2026. One-time setup:

1. Open the [publisher management page](https://marketplace.visualstudio.com/manage)
   and select the `davidnussio` publisher
2. **Trusted Publishing → Create**, with repository owner `davidnussio`,
   repository `vscode-jq-playground`, workflow file `release.yml` and no
   environment

**Open VSX — access token.** Create one at
<https://open-vsx.org/user-settings/tokens> and store it as the `OVSX_TOKEN`
repository secret:

```bash
gh secret set OVSX_TOKEN
```
