import { lstat, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { ProjectContractError } from '../errors';
import { projectIdPattern, rejectEscapedRoot } from '../project-manifest/paths';

const captionsFileSuffix = '.captions.json';
const narrationDirectoryName = 'narration';

export interface CaptionContentFiles {
  captionsPath: string;
  directory: string;
  displayPaths: {
    captions: string;
    narrationDirectory: string;
  };
  id: string;
  narrationDirectory: string;
}

export interface LoadCaptionContentRequest {
  captionsFile: string;
  rootDirectory: string;
}

export async function loadCaptionContent(
  request: LoadCaptionContentRequest,
): Promise<CaptionContentFiles> {
  const rootDirectory = await realpath(path.resolve(request.rootDirectory));
  const resolvedFile = path.resolve(rootDirectory, request.captionsFile);

  rejectEscapedRoot({
    displayPath: request.captionsFile,
    rootDirectory,
    targetPath: resolvedFile,
  });

  if (!resolvedFile.endsWith(captionsFileSuffix)) {
    throw new ProjectContractError(
      `Captions file must end with ${captionsFileSuffix}.`,
    );
  }

  const captionsPath = await requireFile(resolvedFile, request.captionsFile);
  rejectEscapedRoot({
    displayPath: request.captionsFile,
    rootDirectory,
    targetPath: captionsPath,
  });

  const directory = path.dirname(captionsPath);
  const id = path.basename(captionsPath, captionsFileSuffix);
  if (!projectIdPattern.test(id)) {
    throw new ProjectContractError(
      `Captions file name must be a safe project ID ending in ${captionsFileSuffix}.`,
    );
  }

  const narrationDirectory = await resolveWritableNarrationDirectory({
    directory,
    rootDirectory,
  });

  return {
    captionsPath,
    directory,
    displayPaths: {
      captions: displayPath(rootDirectory, captionsPath),
      narrationDirectory: displayPath(rootDirectory, narrationDirectory),
    },
    id,
    narrationDirectory,
  };
}

async function requireFile(filePath: string, display: string): Promise<string> {
  try {
    const realFilePath = await realpath(filePath);
    const fileStats = await stat(realFilePath);

    if (!fileStats.isFile()) {
      throw new ProjectContractError(`${display} must be a file.`);
    }

    return realFilePath;
  } catch (error: unknown) {
    if (error instanceof ProjectContractError) {
      throw error;
    }

    throw new ProjectContractError(`${display} is required.`);
  }
}

async function resolveWritableNarrationDirectory(request: {
  directory: string;
  rootDirectory: string;
}): Promise<string> {
  const narrationDirectory = path.join(
    request.directory,
    narrationDirectoryName,
  );
  rejectEscapedRoot({
    displayPath: narrationDirectoryName,
    rootDirectory: request.rootDirectory,
    targetPath: narrationDirectory,
  });

  try {
    const stats = await lstat(narrationDirectory);
    if (stats.isSymbolicLink()) {
      throw new ProjectContractError('narration/ must not be a symlink.');
    }

    const realDirectory = await realpath(narrationDirectory);
    rejectEscapedRoot({
      displayPath: narrationDirectoryName,
      rootDirectory: request.rootDirectory,
      targetPath: realDirectory,
    });
  } catch (error: unknown) {
    if (error instanceof ProjectContractError) {
      throw error;
    }
    if (!isMissingPathError(error)) {
      throw error;
    }
  }

  return narrationDirectory;
}

function displayPath(rootDirectory: string, targetPath: string): string {
  return path.relative(rootDirectory, targetPath);
}

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
