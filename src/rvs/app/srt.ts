import { lstat, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readAudioDuration } from '../audio/duration';
import { readCaptionBlocks } from '../caption-blocks/read';
import { ProjectContractError } from '../errors';
import { loadCaptionBlocksProject } from '../projects/load';
import { formatSrt } from '../subtitles/format';
import { scheduleSubtitleCues } from '../subtitles/schedule';

export interface WriteSrtRequest {
  readDuration?: typeof readAudioDuration;
  rootDirectory?: string;
  project: string;
}

export interface WriteSrtResult {
  captionCount: number;
  captionsLocation: string;
  captionsPath: string;
  projectId: string;
}

export async function writeProjectSrt(
  request: WriteSrtRequest,
): Promise<WriteSrtResult> {
  const rootDirectory = path.resolve(request.rootDirectory ?? process.cwd());
  const project = await loadCaptionBlocksProject({
    project: request.project,
    rootDirectory,
  });
  const blocks = await readCaptionBlocks(project.captionBlocksPath);
  const readDuration = request.readDuration ?? readAudioDuration;
  const audioDirectory = await requireAudioDirectory(
    project.audioDirectory,
    `projects/${project.id}/audio`,
  );

  const cues = scheduleSubtitleCues(
    await Promise.all(
      blocks.map(async (block) => {
        const audioPath = await requireAudioFile({
          audioDirectory,
          displayPath: `projects/${project.id}/audio/${block.fileName}`,
          fileName: block.fileName,
        });
        const durationSeconds = await readDuration(
          audioPath,
          `projects/${project.id}/audio/${block.fileName}`,
        );

        return {
          durationMs: durationSeconds * 1000,
          fileName: block.fileName,
          text: block.text,
        };
      }),
    ),
  );

  await assertWritableCaptionsPath(project.captionsPath);
  await writeFile(project.captionsPath, formatSrt(cues));

  return {
    captionCount: cues.length,
    captionsLocation: path.relative(rootDirectory, project.captionsPath),
    captionsPath: project.captionsPath,
    projectId: project.id,
  };
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

async function assertWritableCaptionsPath(captionsPath: string): Promise<void> {
  try {
    const stats = await lstat(captionsPath);
    if (stats.isSymbolicLink()) {
      throw new ProjectContractError('captions.srt must not be a symlink.');
    }
    if (!stats.isFile()) {
      throw new ProjectContractError('captions.srt must be a file.');
    }
  } catch (error: unknown) {
    if (error instanceof ProjectContractError) {
      throw error;
    }
    if (!isMissingPathError(error)) {
      throw error;
    }
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

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
