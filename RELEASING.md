# Releasing

## Prerequisites

- [pnpm](https://pnpm.io/) installed
- A [Visual Studio Marketplace](https://marketplace.visualstudio.com/) publisher account (`davidnussio`)
- An [Open VSX Registry](https://open-vsx.org/) account with a valid token
- Logged in via `vsce login davidnussio`

## Manual Release (local)

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

Releases are automated via the `release.yml` workflow. It triggers when a GitHub Release is created.

### Creating a release

1. Go to **Releases → Draft a new release** on GitHub
2. Create a tag matching the version (e.g. `v5.0.6`)
3. Fill in the release notes
4. Check **Set as a pre-release** if applicable
5. Click **Publish release**

The workflow will:

- Extract the version from the tag (strips the `v` prefix)
- Build and package the extension
- Publish to both VS Marketplace and Open VSX Registry
- For pre-releases, the `--pre-release` flag is passed automatically
- Upload the `.vsix` artifact to the GitHub Release

### Required secrets

| Secret | Description |
|---|---|
| `VSCE_PAT` | VS Marketplace Personal Access Token |
| `OVSX_TOKEN` | Open VSX Registry token |
