# Contributing

## Scope

`rvs` is a Bun and TypeScript CLI for rendering Remotion vertical shorts from
project directories.

The repository owns:

- the CLI entrypoint in `src/rvs/main.ts`
- the CLI boundary in `src/rvs/cli/`
- the application layer in `src/rvs/app/`
- the project contract in `src/rvs/projects/`
- the subtitle contract in `src/rvs/subtitles/`
- the Remotion composition in `src/rvs/composition/`
- direct Remotion rendering in `src/rvs/remotion/`
- the repository-owned tests in `tests/`
- the validation surface in `package.json`
- the GitHub Actions automation in `.github/workflows/`

## Local Verification

`bun` is the canonical local task surface.

The repository-owned tasks are:

- `bun run rvs render <project-id>`
- `bun run fix`
- `bun run check`
- `bun run test`

`bun run fix` applies Biome formatting and safe lint fixes.
`bun run check` runs Biome validation and TypeScript typechecking.
`bun run test` runs the Bun test suite.

## Runtime Version

The Bun version is fixed by the `packageManager` field in `package.json`.
Local development and GitHub Actions read the same repository-owned version.
