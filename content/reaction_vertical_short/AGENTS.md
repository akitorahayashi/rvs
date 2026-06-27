# Reaction Vertical Short

## Purpose

`reaction_vertical_short` is a short-form vertical video type built from one
source video, one captions document, generated narration audio, and shared BGM.

## Input Contract

Each production unit owns one project directory under `planned/`, `active/`,
`published/`, or `archived/`.

- `<work>.project.ts`
- `<work>.captions.json`
- `<work>.script.srt`
- `<work>.video-analysis.md`
- `<work>.thread-summary.md`
- `narration/`

`<work>.project.ts` references this contract with one comment line:

- `// Contract: content/reaction_vertical_short/AGENTS.md`

## Project Manifest Contract

Required in `.project.ts`:

- `id`
- `type`
- `video.name`
- `video.source`
- `video.sourceVolume`
- `audio.bgm`
- `audio.bgmVolume`
- `captions.strokeWidthPx`

`.project.ts` stores source and BGM file names only. Directory conventions are
owned by `src/video-types/reaction-vertical-short.ts`.

## Media Contract

Heavy media files are stored outside `content/`.

- Shared BGM lives under `media/bgm/`.
- Source videos live under `media/reaction_vertical_short/source/`.
- Rendered outputs live under `media/reaction_vertical_short/output/<video-name>.mp4`.
- Generated narration audio lives under the project sibling `narration/`.

## Workflow

1. Captions are saved as `<work>.captions.json`.
2. Narration is generated with `rvs tts <work>.captions.json`.
3. Rendering is generated with `rvs render <work>.project.ts`.
4. Published lightweight content stays together under `published/<work>/`.
