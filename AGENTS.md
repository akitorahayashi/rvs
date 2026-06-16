# Agent Guide

## Purpose

`rvs` is a Bun and TypeScript CLI for rendering Remotion vertical shorts from
project directories.

## Runtime

- Use Bun commands only.
- Keep the package as ESM with `type: "module"` in `package.json`.
- Install dependencies with `bun install`.
- Run the CLI with `bun run rvs render <project-id>`.
- Run static validation with `bun run check`.
- Run tests with `bun run test`.
- Apply repository formatting with `bun run fix`.

## Project Contract

- Authored render inputs live under `projects/<project-id>/`.
- A render project contains `background.mp4` and `captions.srt`.
- Generated final videos live under `output/<project-id>/<timestamp>.mp4`.
- `output/.gitkeep` is tracked and generated videos under `output/` are ignored.
- `.tmp/` is not an authored input contract.

## Development Rules

- Keep dependencies minimal and clearly justified.
- Use `cac` as the command-line boundary for command declaration, help, option
  parsing, and required argument validation.
- Keep the CLI surface small and explicit.
- Keep the structure aligned to `cli/`, `app/`, and specific implementation
  domains.
- Use direct Remotion APIs instead of shelling out to the Remotion CLI.
- Keep Remotion root source static and pass render props in memory.
- Do not add silent fallback behavior.
- Keep tests focused on externally observable behavior.
- Do not read `.mx/*.md` unless explicitly requested by the user.
