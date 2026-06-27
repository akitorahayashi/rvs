# Agent Guide

## Purpose

`rvs` is a Bun and TypeScript CLI for preparing and rendering Remotion vertical
shorts from lightweight content projects and isolated media files.

## CLI

`main.ts` creates the `Cli` instance (clipanion), registers all `Command` subclasses, and exports `runCommandLine()`. Each command is a `Command` subclass in `src/cli/`; options are declared with `Option.*` helpers and routing uses `static paths`. Domain errors extend `AppError` from `errors.ts`; usage errors use `CommandLineError` (re-exported from clipanion's `UsageError`).

## Project Contract

- Lightweight authored content lives under
  `content/reaction_vertical_short/{planned,active,published,archived}/<work>/`.
- Each project directory contains `<work>.project.ts` and `<work>.captions.json`.
- `<work>.project.ts` default-exports `defineProject(...)` from
  `src/project-manifest/define.ts`.
- `<work>.captions.json` uses `tts_format: "caption_narration/v1"` and ordered
  `file_name`, `caption`, and `narration` blocks.
- Shared BGM files live under `media/bgm/`.
- Source videos live under `media/reaction_vertical_short/source/`.
- Rendered videos live under `media/reaction_vertical_short/output/<video-name>.mp4`.
- Generated narration MP3 files live under the project sibling `narration/`
  directory and are ignored.
- `.project.ts` stores source and BGM file names only; directory conventions are
  owned by `src/video-types/reaction-vertical-short.ts`.
- `.tmp/` is not an authored input contract.

## Implementation Notes

- `caption_narration/v1` is the only TTS input format.
- VOICEVOX engine access is explicit through `RVS_VOICEVOX_ENGINE_URL` or the default local engine URL.
- The local VOICEVOX engine runs on Docker image `voicevox/voicevox_engine:cpu-ubuntu22.04-0.25.0`.
- Remotion rendering uses direct APIs (`@remotion/bundler`, `@remotion/renderer`, `@remotion/media-parser`); the Remotion CLI is not used.
- Remotion root source is static; render props are passed in memory with
  repository-relative asset paths.
- Do not read `.mx/*.md` unless explicitly requested by the user.
