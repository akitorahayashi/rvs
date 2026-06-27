import { stat } from 'node:fs/promises';
import path from 'node:path';
import { readAudioDuration } from '../audio/duration';
import { buildCaptionBlockAudioAssets } from '../speech/formats/caption-narration-v1';
import { readVideoMetadata } from '../video/metadata';
import type { CaptionedVideoBinding } from './binding';
import { readCaptionBlocks } from './captions';
import type { CaptionFrameCue, NarrationFrameCue } from './render-props';

export interface PreparedNarrationFrameCue
  extends Omit<NarrationFrameCue, 'audioFile'> {
  sourcePath: string;
}

export interface PreparedCaptionedVideoRenderInput {
  bgmPath: string;
  captions: CaptionFrameCue[];
  durationInFrames: number;
  narration: PreparedNarrationFrameCue[];
  outputPath: string;
  sourcePath: string;
}

export async function prepareCaptionedVideoRenderInput(request: {
  binding: CaptionedVideoBinding;
}): Promise<PreparedCaptionedVideoRenderInput> {
  await requireFile(
    request.binding.paths.source,
    request.binding.displayPaths.source,
  );
  await requireFile(
    request.binding.paths.bgm,
    request.binding.displayPaths.bgm,
  );
  await requireFile(
    request.binding.paths.captions,
    request.binding.displayPaths.captions,
  );
  await requireDirectory(
    request.binding.paths.narrationDirectory,
    request.binding.displayPaths.narrationDirectory,
  );

  const metadata = await readVideoMetadata({
    displayPath: request.binding.displayPaths.source,
    videoPath: request.binding.paths.source,
  });
  const bgmDurationSeconds = await readAudioDuration(
    request.binding.paths.bgm,
    request.binding.displayPaths.bgm,
  );
  const blocks = await readCaptionBlocks(request.binding.paths.captions);
  const narration = await buildNarrationTimeline({
    assets: buildCaptionBlockAudioAssets(blocks),
    fps: metadata.fps,
    narrationDirectory: request.binding.paths.narrationDirectory,
  });

  if (bgmDurationSeconds < metadata.durationInSeconds) {
    throw new Error(
      `${request.binding.displayPaths.bgm} must be at least ${metadata.durationInSeconds.toFixed(3)} seconds to cover the rendered source video duration, but was ${bgmDurationSeconds.toFixed(3)} seconds.`,
    );
  }
  if (metadata.durationInFrames < narration.durationInFrames) {
    throw new Error(
      `${request.binding.displayPaths.source} must be at least ${narration.durationInFrames} frames, but was ${metadata.durationInFrames} frames.`,
    );
  }

  const captions = narration.cues.map((cue) => ({
    durationInFrames: cue.durationInFrames,
    id: cue.id,
    startFrame: cue.startFrame,
    text: cue.text,
  }));

  return {
    bgmPath: request.binding.paths.bgm,
    captions,
    durationInFrames: metadata.durationInFrames,
    narration: narration.cues,
    outputPath: request.binding.paths.output,
    sourcePath: request.binding.paths.source,
  };
}

async function buildNarrationTimeline(request: {
  assets: ReturnType<typeof buildCaptionBlockAudioAssets>;
  fps: number;
  narrationDirectory: string;
}): Promise<{
  cues: Array<PreparedNarrationFrameCue & { text: string }>;
  durationInFrames: number;
}> {
  const assetsWithDurations = await Promise.all(
    request.assets.map(async (asset) => {
      const sourcePath = path.join(request.narrationDirectory, asset.fileName);
      const displayPath = path.join('narration', asset.fileName);
      await requireFile(sourcePath, displayPath);
      const durationSeconds = await readAudioDuration(sourcePath, displayPath);

      return {
        asset,
        durationSeconds,
        sourcePath,
      };
    }),
  );

  let cursorSeconds = 0;
  const cues: Array<PreparedNarrationFrameCue & { text: string }> = [];

  for (const { asset, durationSeconds, sourcePath } of assetsWithDurations) {
    const startFrame = Math.round(cursorSeconds * request.fps);
    cursorSeconds += durationSeconds;
    const endFrame = Math.round(cursorSeconds * request.fps);

    cues.push({
      durationInFrames: Math.max(1, endFrame - startFrame),
      id: asset.id,
      sourcePath,
      startFrame,
      text: asset.block.caption,
    });
  }

  const lastCue = cues.at(-1);
  if (lastCue === undefined) {
    throw new Error('Caption blocks must not be empty.');
  }

  return {
    cues,
    durationInFrames: lastCue.startFrame + lastCue.durationInFrames,
  };
}

async function requireFile(
  filePath: string,
  displayPath: string,
): Promise<void> {
  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) {
      throw new Error(`${displayPath} must be a file.`);
    }
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      throw new Error(`${displayPath} is required.`);
    }
    throw error;
  }
}

async function requireDirectory(
  directory: string,
  displayPath: string,
): Promise<void> {
  try {
    const stats = await stat(directory);
    if (!stats.isDirectory()) {
      throw new Error(`${displayPath} must be a directory.`);
    }
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      throw new Error(`${displayPath} is required.`);
    }
    throw error;
  }
}

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
