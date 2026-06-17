import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { readAudioDuration } from '../audio/duration';
import { readCaptionBlocks } from '../caption-blocks/read';
import { ProjectContractError } from '../errors';
import type { NarrationCue } from './cue';
import { scheduleNarrationCues } from './timeline';

export interface ReadProjectNarrationRequest {
  project: {
    audioDirectory: string;
    captionBlocksPath: string;
    id: string;
  };
  readDuration?: typeof readAudioDuration;
}

export async function readProjectNarrationCues(
  request: ReadProjectNarrationRequest,
): Promise<NarrationCue[]> {
  const blocks = await readCaptionBlocks(request.project.captionBlocksPath);
  const readDuration = request.readDuration ?? readAudioDuration;
  const audioDirectory = await requireAudioDirectory(
    request.project.audioDirectory,
    `projects/${request.project.id}/audio`,
  );

  return scheduleNarrationCues(
    await Promise.all(
      blocks.map(async (block) => {
        const displayPath = `projects/${request.project.id}/audio/${block.fileName}`;
        const audioPath = await requireAudioFile({
          audioDirectory,
          displayPath,
          fileName: block.fileName,
        });
        const durationSeconds = await readDuration(audioPath, displayPath);

        return {
          audioFile: toAudioAssetPath(block.fileName),
          durationMs: durationSeconds * 1000,
          text: block.text,
        };
      }),
    ),
  );
}

async function requireAudioDirectory(
  audioDirectory: string,
  displayPath: string,
): Promise<string> {
  try {
    const realDirectory = await realpath(audioDirectory);
    const stats = await stat(realDirectory);

    if (!stats.isDirectory()) {
      throw new ProjectContractError(`${displayPath} must be a directory.`);
    }

    return realDirectory;
  } catch (error: unknown) {
    if (error instanceof ProjectContractError) {
      throw error;
    }

    throw new ProjectContractError(`${displayPath} is required.`);
  }
}

async function requireAudioFile(request: {
  audioDirectory: string;
  displayPath: string;
  fileName: string;
}): Promise<string> {
  const audioPath = path.join(request.audioDirectory, request.fileName);

  try {
    const realFilePath = await realpath(audioPath);
    const stats = await stat(realFilePath);

    if (!stats.isFile()) {
      throw new ProjectContractError(`${request.displayPath} must be a file.`);
    }

    rejectEscapedAudioFile({
      audioDirectory: request.audioDirectory,
      audioPath: realFilePath,
      displayPath: request.displayPath,
    });

    return realFilePath;
  } catch (error: unknown) {
    if (error instanceof ProjectContractError) {
      throw error;
    }

    throw new ProjectContractError(`${request.displayPath} is required.`);
  }
}

function rejectEscapedAudioFile(request: {
  audioDirectory: string;
  audioPath: string;
  displayPath: string;
}): void {
  const relativePath = path.relative(request.audioDirectory, request.audioPath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new ProjectContractError(
      `${request.displayPath} must stay inside audio/.`,
    );
  }
}

function toAudioAssetPath(fileName: string): string {
  return path.posix.join('audio', fileName);
}
