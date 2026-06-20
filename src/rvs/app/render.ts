import path from 'node:path';
import { readAudioDuration } from '../audio/duration';
import { MediaContractError } from '../errors';
import { readVideoMetadata } from '../media/video';
import { readProjectNarrationCues } from '../narration/project-timeline';
import { toFrameNarrationCues } from '../narration/timeline';
import { loadRenderProject } from '../projects/load';
import { createOutputPath } from '../projects/paths';
import {
  createRenderProps,
  defaultBgmVolume,
  defaultNarrationVolume,
} from '../remotion/props';
import { renderShortVideo } from '../remotion/render';
import { assertCuesFitVideo, toFrameCues } from '../subtitles/timing';

export interface RenderProjectRequest {
  now?: Date;
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
  const project = await loadRenderProject({
    project: request.project,
    rootDirectory,
  });
  const metadata = await readVideoMetadata(project.backgroundPath);
  await assertBgmCoversRenderDuration({
    bgmPath: project.bgmPath,
    durationInFrames: metadata.durationInFrames,
    fps: metadata.fps,
    projectId: project.id,
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

  const outputPath = await createOutputPath({
    now: request.now,
    projectId: project.id,
    rootDirectory,
  });
  const props = createRenderProps({
    backgroundVideo: project.backgroundAssetPath,
    bgm: project.bgmAssetPath,
    bgmVolume: defaultBgmVolume,
    captions: captionCues,
    durationInFrames: metadata.durationInFrames,
    fps: metadata.fps,
    height: metadata.height,
    narration: narrationFrameCues,
    narrationVolume: defaultNarrationVolume,
    width: metadata.width,
  });

  await renderShortVideo({
    inputProps: props,
    outputPath,
    publicDir: project.directory,
    rootDirectory,
  });

  return {
    outputLocation: path.relative(rootDirectory, outputPath),
    outputPath,
    projectId: project.id,
  };
}

export async function assertBgmCoversRenderDuration(request: {
  bgmPath?: string;
  durationInFrames: number;
  fps: number;
  projectId: string;
  readDuration?: typeof readAudioDuration;
}): Promise<void> {
  if (!request.bgmPath) {
    return;
  }

  const displayPath = `projects/${request.projectId}/bgm.mp3`;
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
