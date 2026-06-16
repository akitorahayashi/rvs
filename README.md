# rvs

`rvs` is a Bun and TypeScript CLI for rendering Remotion vertical shorts.

The current MVP renders one project directory into one captioned MP4. A project
contains a background video and SRT captions. The renderer uses the background
video as the full-frame visual layer and draws each caption at its SRT timing.

## Setup

```bash
bun install
```

## Project Layout

```txt
projects/
  <project-id>/
    background.mp4
    captions.srt
```

Project references are either `<project-id>` or `projects/<project-id>`.
Authored render inputs stay under `projects/`.

## Usage

```bash
bun run rvs render whale
```

Successful renders produce timestamped final artifacts:

```txt
output/
  <project-id>/
    <timestamp>.mp4
```

Generated videos under `output/` are ignored. `output/.gitkeep` keeps the final
artifact directory convention present in the repository.

## Task Surface

```bash
bun run rvs render whale
bun run check
bun run test
```

`bun run fix` applies Biome formatting and safe lint fixes.

## Runtime

The package is ESM via `type: "module"` in `package.json`.
The repository runs the renderer through the Bun script `bun run rvs`.
The runtime entrypoint is `src/rvs/main.ts`.
The command-line boundary lives under `src/rvs/cli/` and uses `cac` for command
declaration, help, option parsing, and required argument validation.
The application layer lives under `src/rvs/app/`.
Project resolution lives under `src/rvs/projects/`.
SRT parsing and frame timing live under `src/rvs/subtitles/`.
Background video metadata lives under `src/rvs/media/`.
The Remotion React composition lives under `src/rvs/composition/`.
Direct Remotion bundling, composition selection, and rendering live under
`src/rvs/remotion/`.

Rendering uses `@remotion/bundler`, `@remotion/renderer`, and
`@remotion/media-parser` directly. The implementation does not generate root
source, generate props files, or shell out to the Remotion CLI.
