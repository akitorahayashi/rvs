import path from 'node:path';
import { readAudioDuration } from '../audio/duration';
import { MediaContractError } from '../errors';
import { readVideoMetadata } from '../media/video';
import { readProjectNarrationCues } from '../narration/project-timeline';
import { toFrameNarrationCues } from '../narration/timeline';
import { createRenderProps } from '../remotion/props';
import { renderShortVideo } from '../remotion/render';
import { assertCuesFitVideo, toFrameCues } from '../subtitles/timing';
import { loadReactionVerticalShort } from '../video-types/reaction-vertical-short';

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
  const project = await loadReactionVerticalShort({
    projectFile: request.project,
    rootDirectory,
  });
  const metadata = await readVideoMetadata(project.sourcePath);
  await assertBgmCoversRenderDuration({
    bgmPath: project.bgmPath,
    displayPath: project.displayPaths.bgm,
    durationInFrames: metadata.durationInFrames,
    fps: metadata.fps,
  });
  const narrationCues = await readProjectNarrationCues({
    project,
  });
  const captionCues = toFrameCues({
    cues: narrationCues,
    fps: metadata.fps,
  });
  const narrationFrameCues = toFrameNarrationCues({
    cues: narrationCues,
    fps: metadata.fps,
  });

  assertCuesFitVideo({
    cues: captionCues,
    durationInFrames: metadata.durationInFrames,
  });

  const props = createRenderProps({
    backgroundVideo: project.sourceAssetPath,
    backgroundVideoVolume: project.volumes.source,
    bgm: project.bgmAssetPath,
    bgmVolume: project.volumes.bgm,
    captions: captionCues,
    durationInFrames: metadata.durationInFrames,
    fps: metadata.fps,
    height: metadata.height,
    narration: narrationFrameCues,
    narrationVolume: project.volumes.narration,
    width: metadata.width,
  });

  await renderShortVideo({
    inputProps: props,
    outputPath: project.outputPath,
    publicDir: rootDirectory,
    rootDirectory,
  });

  return {
    outputLocation: project.displayPaths.output,
    outputPath: project.outputPath,
    projectId: project.id,
  };
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
      `${displayPath} must be at least ${requiredDurationSeconds.toFixed(3)} seconds to cover the rendered background duration, but was ${bgmDurationSeconds.toFixed(3)} seconds.`,
    );
  }
}
