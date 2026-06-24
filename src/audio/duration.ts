import { parseMedia } from '@remotion/media-parser';
import { nodeReader } from '@remotion/media-parser/node';
import { MediaContractError } from '../errors';

export async function readAudioDuration(
  audioPath: string,
  displayPath: string,
): Promise<number> {
  let result: { slowDurationInSeconds: number };

  try {
    result = await parseMedia({
      acknowledgeRemotionLicense: true,
      fields: {
        slowDurationInSeconds: true,
      },
      reader: nodeReader,
      src: audioPath,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MediaContractError(
      `Failed to parse audio duration for ${displayPath}: ${message}`,
    );
  }

  if (
    !Number.isFinite(result.slowDurationInSeconds) ||
    result.slowDurationInSeconds <= 0
  ) {
    throw new MediaContractError(
      `${displayPath} must have a positive duration.`,
    );
  }

  return result.slowDurationInSeconds;
}
