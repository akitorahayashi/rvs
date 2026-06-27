import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { readAudioDuration } from '../audio/duration';
import {
  type PreparedCaptionedVideoRenderInput,
  prepareCaptionedVideoRenderInput,
} from '../captioned-video/render-input';
import {
  type CaptionedVideoRenderProps,
  parseCaptionedVideoRenderProps,
} from '../captioned-video/render-props';
import { MediaContractError } from '../errors';
import { renderCaptionedVideo } from '../remotion/render';
import { loadVideoProject } from '../video-types/registry';

export interface RenderProjectRequest {
  project: string;
  rootDirectory?: string;
}

export interface RenderProjectResult {
  outputLocation: string;
  outputPath: string;
  projectId: string;
}

export async function renderProject(
  request: RenderProjectRequest,
): Promise<RenderProjectResult> {
  const rootDirectory = path.resolve(request.rootDirectory ?? process.cwd());
  const loaded = await loadVideoProject({
    projectFile: request.project,
    rootDirectory,
  });
  const binding = loaded.captionedVideo;
  const prepared = await prepareCaptionedVideoRenderInput({
    binding,
  });
  await assertBgmCoversRenderDuration({
    bgmPath: prepared.bgmPath,
    displayPath: binding.displayPaths.bgm,
    durationInFrames: prepared.durationInFrames,
    fps: binding.settings.canvas.fps,
  });

  const inputProps = createInputProps({
    binding,
    prepared,
  });
  await mkdir(path.dirname(prepared.outputPath), { recursive: true });

  await renderCaptionedVideo({
    inputProps,
    outputPath: prepared.outputPath,
    publicDir: rootDirectory,
    rootDirectory,
  });

  return {
    outputLocation: binding.displayPaths.output,
    outputPath: prepared.outputPath,
    projectId: binding.id,
  };
}

function createInputProps(request: {
  binding: Awaited<ReturnType<typeof loadVideoProject>>['captionedVideo'];
  prepared: PreparedCaptionedVideoRenderInput;
}): CaptionedVideoRenderProps {
  return parseCaptionedVideoRenderProps({
    bgm: request.binding.displayPaths.bgm,
    bgmVolume: request.binding.settings.audio.bgmVolume,
    captions: request.prepared.captions,
    captionPosition: request.binding.settings.captions.position,
    captionStrokeWidthPx: request.binding.settings.captions.strokeWidthPx,
    durationInFrames: request.prepared.durationInFrames,
    fps: request.binding.settings.canvas.fps,
    height: request.binding.settings.canvas.height,
    narration: request.prepared.narration.map((cue) => ({
      audioFile: path.posix.join('narration', path.basename(cue.sourcePath)),
      durationInFrames: cue.durationInFrames,
      id: cue.id,
      startFrame: cue.startFrame,
    })),
    narrationVolume: request.binding.settings.audio.narrationVolume,
    sourceVideo: request.binding.displayPaths.source,
    sourceVideoVolume: request.binding.settings.audio.sourceVideoVolume,
    width: request.binding.settings.canvas.width,
  });
}

export async function assertBgmCoversRenderDuration(request: {
  bgmPath?: string;
  displayPath?: string;
  durationInFrames: number;
  fps: number;
  readDuration?: typeof readAudioDuration;
}): Promise<void> {
  if (!request.bgmPath) {
    return;
  }

  const displayPath = request.displayPath ?? request.bgmPath;
  const bgmDurationSeconds = await (request.readDuration ?? readAudioDuration)(
    request.bgmPath,
    displayPath,
  );
  const requiredDurationSeconds = request.durationInFrames / request.fps;

  if (bgmDurationSeconds < requiredDurationSeconds) {
    throw new MediaContractError(
      `${displayPath} must be at least ${requiredDurationSeconds.toFixed(3)} seconds to cover the rendered source video duration, but was ${bgmDurationSeconds.toFixed(3)} seconds.`,
    );
  }
}
