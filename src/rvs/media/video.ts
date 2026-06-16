import { parseMedia } from '@remotion/media-parser';
import { nodeReader } from '@remotion/media-parser/node';
import { MediaContractError } from '../errors';

export interface VideoMetadata {
  durationInFrames: number;
  durationInSeconds: number;
  fps: number;
  height: number;
  width: number;
}

export async function readVideoMetadata(
  videoPath: string,
): Promise<VideoMetadata> {
  const result = await parseMedia({
    acknowledgeRemotionLicense: true,
    fields: {
      dimensions: true,
      slowDurationInSeconds: true,
      slowFps: true,
    },
    reader: nodeReader,
    src: videoPath,
  });

  if (!result.dimensions) {
    throw new MediaContractError('background.mp4 must contain a video track.');
  }

  if (
    !Number.isFinite(result.slowDurationInSeconds) ||
    result.slowDurationInSeconds <= 0
  ) {
    throw new MediaContractError(
      'background.mp4 must have a positive duration.',
    );
  }

  if (!Number.isFinite(result.slowFps) || result.slowFps <= 0) {
    throw new MediaContractError('background.mp4 must have a positive FPS.');
  }

  return {
    durationInFrames: Math.ceil(result.slowDurationInSeconds * result.slowFps),
    durationInSeconds: result.slowDurationInSeconds,
    fps: result.slowFps,
    height: result.dimensions.height,
    width: result.dimensions.width,
  };
}
