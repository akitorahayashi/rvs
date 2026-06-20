# Agent Guide

## Purpose

`rvs` is a Bun and TypeScript CLI for preparing and rendering Remotion vertical
shorts from project directories.

## Runtime

- Use Bun commands only.
- Keep the package as ESM with `type: "module"` in `package.json`.
- Install dependencies with `bun install`.
- Start the local VOICEVOX engine with `bun run serve` or `bun run s`.
- Run the CLI with `bun run rvs tts <project-id>`,
  `bun run rvs render <project-id>`, and `bun run rvs serve`.
- Run static validation with `bun run check`.
- Run tests with `bun run test`.
- Apply repository formatting with `bun run fix`.

## Project Contract

- Authored render inputs live under `projects/<project-id>/`.
- A project contains `background.mp4` and `caption-blocks.json`.
- A project may include `bgm.mp3` as authored background music.
- `caption-blocks.json` uses `format: "caption_blocks/v1"` and ordered
  `file_name` slug/`caption` blocks, with optional `narration` for TTS-specific
  reading.
- `bgm.mp3`, when present, is rendered under narration and is trimmed to the
  rendered background duration. It must be at least that long.
- Default narration and BGM render volumes are defined in
  `src/rvs/remotion/props.ts`.
- TTS generates numbered MP3 files from block order and `file_name`.
- Generated narration MP3 files live under `projects/<project-id>/audio/` and
  are ignored.
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
- Keep `caption_blocks/v1` as the only TTS input format until another format is
  explicitly needed.
- Keep VOICEVOX engine access explicit through `RVS_VOICEVOX_ENGINE_URL` or the
  default local engine URL.
- Keep the local VOICEVOX engine startup on the Docker image
  `voicevox/voicevox_engine:cpu-ubuntu22.04-0.25.0`.
- Use direct Remotion APIs instead of shelling out to the Remotion CLI.
- Keep Remotion root source static and pass render props in memory.
- Do not add silent fallback behavior.
- Keep tests focused on externally observable behavior.
- Do not read `.mx/*.md` unless explicitly requested by the user.
