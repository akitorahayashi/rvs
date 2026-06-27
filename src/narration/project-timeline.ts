import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { readAudioDuration } from '../audio/duration';
import { narrationAudioFileName } from '../audio/naming';
import { readCaptions } from '../captions/read';
import { ProjectContractError } from '../errors';
import type { NarrationCue } from './cue';
import { scheduleNarrationCues } from './timeline';

export interface ReadProjectNarrationRequest {
  project: {
    captionsPath: string;
    displayPaths: {
      narrationDirectory: string;
    };
    id: string;
    narrationDirectory: string;
  };
  readDuration?: typeof readAudioDuration;
}

export async function readProjectNarrationCues(
  request: ReadProjectNarrationRequest,
): Promise<NarrationCue[]> {
  const blocks = await readCaptions(request.project.captionsPath);
  const readDuration = request.readDuration ?? readAudioDuration;
  const narrationDirectory = await requireNarrationDirectory(
    request.project.narrationDirectory,
    request.project.displayPaths.narrationDirectory,
  );

  return scheduleNarrationCues(
    await Promise.all(
      blocks.map(async (block, index) => {
        const fileName = narrationAudioFileName(index, block.fileName);
        const displayPath = path.join(
          request.project.displayPaths.narrationDirectory,
          fileName,
        );
        const audioPath = await requireNarrationFile({
          displayPath,
          fileName,
          narrationDirectory,
        });
        const durationSeconds = await readDuration(audioPath, displayPath);

        return {
          audioFile: toAudioAssetPath(fileName),
          durationMs: durationSeconds * 1000,
          text: block.caption,
        };
      }),
    ),
  );
}

async function requireNarrationDirectory(
  narrationDirectory: string,
  displayPath: string,
): Promise<string> {
  try {
    const realDirectory = await realpath(narrationDirectory);
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

async function requireNarrationFile(request: {
  displayPath: string;
  fileName: string;
  narrationDirectory: string;
}): Promise<string> {
  const audioPath = path.join(request.narrationDirectory, request.fileName);

  try {
    const realFilePath = await realpath(audioPath);
    const stats = await stat(realFilePath);

    if (!stats.isFile()) {
      throw new ProjectContractError(`${request.displayPath} must be a file.`);
    }

    rejectEscapedNarrationFile({
      audioPath: realFilePath,
      displayPath: request.displayPath,
      narrationDirectory: request.narrationDirectory,
    });

    return realFilePath;
  } catch (error: unknown) {
    if (error instanceof ProjectContractError) {
      throw error;
    }

    throw new ProjectContractError(`${request.displayPath} is required.`);
  }
}

function rejectEscapedNarrationFile(request: {
  audioPath: string;
  displayPath: string;
  narrationDirectory: string;
}): void {
  const relativePath = path.relative(
    request.narrationDirectory,
    request.audioPath,
  );
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new ProjectContractError(
      `${request.displayPath} must stay inside narration/.`,
    );
  }
}

function toAudioAssetPath(fileName: string): string {
  return path.posix.join('narration', fileName);
}
