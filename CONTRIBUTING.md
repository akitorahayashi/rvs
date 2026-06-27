# Contributing

## Scope

The repository owns:

- the CLI entrypoint in `src/main.ts`
- the CLI boundary in `src/cli/`
- the application layer in `src/app/`
- the captioned video production domain in `src/captioned-video/`
- the project manifest contract in `src/project-manifest/`
- the speech and TTS format domain in `src/speech/`
- the video type contract in `src/video-types/`
- the narration audio contract in `src/audio/`
- the video metadata contract in `src/video/`
- the VOICEVOX client in `src/voicevox/`
- direct Remotion rendering in `src/remotion/`
- the repository-owned tests in `tests/`
- the validation surface in `package.json`
- the GitHub Actions automation in `.github/workflows/`

## Local Verification

`bun` is the canonical local task surface.

The repository-owned tasks are:

- `bun run rvs render <project-file>`
- `bun run rvs tts <captions-file>`
- `bun run fix`
- `bun run check`
- `bun run test`

`bun run fix` applies Biome formatting and safe lint fixes.
`bun run check` runs Biome validation and TypeScript typechecking.
`bun run test` runs the Bun test suite.

## Runtime Version

The Bun version is fixed by the `packageManager` field in `package.json`.
Local development and GitHub Actions read the same repository-owned version.
