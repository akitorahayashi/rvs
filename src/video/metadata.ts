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

export async function readVideoMetadata(request: {
  displayPath: string;
  videoPath: string;
}): Promise<VideoMetadata> {
  const result = await parseVideoMetadata(request.videoPath);

  if (!result.dimensions) {
    throw new MediaContractError(
      `${request.displayPath} must contain a video track.`,
    );
  }

  if (
    !Number.isFinite(result.dimensions.width) ||
    result.dimensions.width <= 0 ||
    !Number.isFinite(result.dimensions.height) ||
    result.dimensions.height <= 0
  ) {
    throw new MediaContractError(
      `${request.displayPath} must have positive dimensions.`,
    );
  }

  if (
    !Number.isFinite(result.slowDurationInSeconds) ||
    result.slowDurationInSeconds <= 0
  ) {
    throw new MediaContractError(
      `${request.displayPath} must have a positive duration.`,
    );
  }

  if (!Number.isFinite(result.slowFps) || result.slowFps <= 0) {
    throw new MediaContractError(
      `${request.displayPath} must have a positive FPS.`,
    );
  }

  return {
    durationInFrames: Math.ceil(result.slowDurationInSeconds * result.slowFps),
    durationInSeconds: result.slowDurationInSeconds,
    fps: result.slowFps,
    height: result.dimensions.height,
    width: result.dimensions.width,
  };
}

async function parseVideoMetadata(videoPath: string) {
  try {
    return await parseMedia({
      acknowledgeRemotionLicense: true,
      fields: {
        dimensions: true,
        slowDurationInSeconds: true,
        slowFps: true,
      },
      reader: nodeReader,
      src: videoPath,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    throw new MediaContractError(
      `Failed to parse source video metadata: ${message}`,
    );
  }
}
