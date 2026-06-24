# Agent Guide

## Purpose

`rvs` is a Bun and TypeScript CLI for preparing and rendering Remotion vertical
shorts from project directories.

## CLI

`main.ts` creates the `Cli` instance (clipanion), registers all `Command` subclasses, and exports `runCommandLine()`. Each command is a `Command` subclass in `src/cli/`; options are declared with `Option.*` helpers and routing uses `static paths`. Domain errors extend `AppError` from `errors.ts`; usage errors use `CommandLineError` (re-exported from clipanion's `UsageError`).

## Project Contract

- Authored render inputs live under `projects/<project-id>/`.
- A project contains `background.mp4` and `caption-blocks.json`.
- A project may include `bgm.mp3` as authored background music.
- `caption-blocks.json` uses `format: "caption_blocks/v1"` and ordered
  `file_name` slug/`caption` blocks, with optional `narration` for TTS-specific
  reading.
- `bgm.mp3`, when present, is rendered under narration and is trimmed to the
  rendered background duration. It must be at least that long.
- Default render volumes are defined in `src/remotion/props.ts`.
- TTS generates numbered MP3 files from block order and `file_name`.
- Generated narration MP3 files live under `projects/<project-id>/audio/` and
  are ignored.
- Generated final videos live under `output/<project-id>/<timestamp>.mp4`.
- `output/.gitkeep` is tracked and generated videos under `output/` are ignored.
- `.tmp/` is not an authored input contract.

## Implementation Notes

- `caption_blocks/v1` is the only TTS input format.
- VOICEVOX engine access is explicit through `RVS_VOICEVOX_ENGINE_URL` or the default local engine URL.
- The local VOICEVOX engine runs on Docker image `voicevox/voicevox_engine:cpu-ubuntu22.04-0.25.0`.
- Remotion rendering uses direct APIs (`@remotion/bundler`, `@remotion/renderer`, `@remotion/media-parser`); the Remotion CLI is not used.
- Remotion root source is static; render props are passed in memory.
- Do not read `.mx/*.md` unless explicitly requested by the user.
