import { stat } from 'node:fs/promises';
import path from 'node:path';
import { ProjectContractError } from '../errors';

const backgroundFileName = 'background.mp4';
const captionsFileName = 'captions.srt';
const projectsDirectoryName = 'projects';
const safeProjectIdPattern = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export interface LoadProjectRequest {
  project: string;
  rootDirectory: string;
}

export interface ProjectFiles {
  backgroundAssetPath: string;
  backgroundPath: string;
  captionsPath: string;
  directory: string;
  id: string;
}

export async function loadProject(
  request: LoadProjectRequest,
): Promise<ProjectFiles> {
  const id = resolveProjectId(request.project);
  const rootDirectory = path.resolve(request.rootDirectory);
  const directory = path.join(rootDirectory, projectsDirectoryName, id);
  const projectsDirectory = path.join(rootDirectory, projectsDirectoryName);

  rejectEscapedProjectDirectory({ directory, projectsDirectory });
  await requireDirectory(directory, `projects/${id}`);

  const backgroundPath = path.join(directory, backgroundFileName);
  const captionsPath = path.join(directory, captionsFileName);

  await requireFile(backgroundPath, `projects/${id}/${backgroundFileName}`);
  await requireFile(captionsPath, `projects/${id}/${captionsFileName}`);

  return {
    backgroundAssetPath: backgroundFileName,
    backgroundPath,
    captionsPath,
    directory,
    id,
  };
}

function resolveProjectId(projectReference: string): string {
  if (projectReference.trim() === '') {
    throw new ProjectContractError('Project reference is required.');
  }

  if (path.isAbsolute(projectReference)) {
    throw new ProjectContractError(
      'Project reference must be a project ID or projects/<project-id>.',
    );
  }

  const segments = projectReference.split(/[\\/]/);

  if (
    segments.some(
      (segment) => segment === '' || segment === '.' || segment === '..',
    )
  ) {
    throw new ProjectContractError(
      'Project reference must be a safe project ID or projects/<project-id>.',
    );
  }

  const id =
    segments.length === 1
      ? segments[0]
      : segments.length === 2 && segments[0] === projectsDirectoryName
        ? segments[1]
        : undefined;

  if (!id || !safeProjectIdPattern.test(id)) {
    throw new ProjectContractError(
      'Project reference must be a safe project ID or projects/<project-id>.',
    );
  }

  return id;
}

function rejectEscapedProjectDirectory(request: {
  directory: string;
  projectsDirectory: string;
}): void {
  const relativeDirectory = path.relative(
    request.projectsDirectory,
    request.directory,
  );

  if (
    relativeDirectory.startsWith('..') ||
    path.isAbsolute(relativeDirectory)
  ) {
    throw new ProjectContractError(
      'Project directory must stay inside projects/.',
    );
  }
}

async function requireDirectory(
  directory: string,
  displayPath: string,
): Promise<void> {
  try {
    const stats = await stat(directory);

    if (!stats.isDirectory()) {
      throw new ProjectContractError(`${displayPath} must be a directory.`);
    }
  } catch (error: unknown) {
    if (error instanceof ProjectContractError) {
      throw error;
    }

    throw new ProjectContractError(`${displayPath} does not exist.`);
  }
}

async function requireFile(
  filePath: string,
  displayPath: string,
): Promise<void> {
  try {
    const stats = await stat(filePath);

    if (!stats.isFile()) {
      throw new ProjectContractError(`${displayPath} must be a file.`);
    }
  } catch (error: unknown) {
    if (error instanceof ProjectContractError) {
      throw error;
    }

    throw new ProjectContractError(`${displayPath} is required.`);
  }
}
