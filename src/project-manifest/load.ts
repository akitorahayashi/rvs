import { randomUUID } from 'node:crypto';
import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ProjectContractError } from '../errors';
import type { ProjectManifest } from './define';
import { projectFileSuffix, rejectEscapedRoot } from './paths';

export interface LoadedProjectManifest {
  directory: string;
  displayPath: string;
  file: string;
  manifest: unknown;
}

export interface LoadProjectManifestRequest {
  projectFile: string;
  rootDirectory: string;
}

export async function loadProjectManifest(
  request: LoadProjectManifestRequest,
): Promise<LoadedProjectManifest> {
  const rootDirectory = await realpath(path.resolve(request.rootDirectory));
  const resolvedFile = path.resolve(rootDirectory, request.projectFile);

  rejectEscapedRoot({
    displayPath: request.projectFile,
    rootDirectory,
    targetPath: resolvedFile,
  });

  if (!resolvedFile.endsWith(projectFileSuffix)) {
    throw new ProjectContractError(
      `Project manifest must end with ${projectFileSuffix}.`,
    );
  }

  const file = await requireFile(resolvedFile, request.projectFile);
  rejectEscapedRoot({
    displayPath: request.projectFile,
    rootDirectory,
    targetPath: file,
  });

  const moduleUrl = pathToFileURL(file);
  moduleUrl.searchParams.set('load', randomUUID());
  const loadedModule = (await import(moduleUrl.href)) as {
    default?: ProjectManifest;
  };

  if (loadedModule.default === undefined) {
    throw new ProjectContractError(
      `${displayPath(rootDirectory, file)} must default-export defineProject(...).`,
    );
  }

  return {
    directory: path.dirname(file),
    displayPath: displayPath(rootDirectory, file),
    file,
    manifest: loadedModule.default,
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

function displayPath(rootDirectory: string, targetPath: string): string {
  return path.relative(rootDirectory, targetPath);
}
