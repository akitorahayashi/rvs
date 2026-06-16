import { lstat, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { ProjectContractError } from '../errors';

const audioDirectoryName = 'audio';
const backgroundFileName = 'background.mp4';
const captionBlocksFileName = 'caption-blocks.json';
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

export interface CaptionBlocksProjectFiles {
  audioDirectory: string;
  captionBlocksPath: string;
  captionsPath: string;
  directory: string;
  id: string;
}

export async function loadProject(
  request: LoadProjectRequest,
): Promise<ProjectFiles> {
  const project = await loadProjectDirectory(request);

  const backgroundPath = path.join(project.directory, backgroundFileName);
  const captionsPath = path.join(project.directory, captionsFileName);

  const backgroundRealPath = await requireFile(
    backgroundPath,
    `projects/${project.id}/${backgroundFileName}`,
  );
  const captionsRealPath = await requireFile(
    captionsPath,
    `projects/${project.id}/${captionsFileName}`,
  );

  rejectEscapedProjectDirectory({
    directory: backgroundRealPath,
    projectsDirectory: project.directory,
  });
  rejectEscapedProjectDirectory({
    directory: captionsRealPath,
    projectsDirectory: project.directory,
  });

  return {
    backgroundAssetPath: backgroundFileName,
    backgroundPath: backgroundRealPath,
    captionsPath: captionsRealPath,
    directory: project.directory,
    id: project.id,
  };
}

export async function loadCaptionBlocksProject(
  request: LoadProjectRequest,
): Promise<CaptionBlocksProjectFiles> {
  const project = await loadProjectDirectory(request);
  const captionBlocksPath = path.join(project.directory, captionBlocksFileName);
  const captionBlocksRealPath = await requireFile(
    captionBlocksPath,
    `projects/${project.id}/${captionBlocksFileName}`,
  );

  rejectEscapedProjectDirectory({
    directory: captionBlocksRealPath,
    projectsDirectory: project.directory,
  });

  const audioDirectory = await resolveWritableChildPath({
    childPath: path.join(project.directory, audioDirectoryName),
    displayPath: `projects/${project.id}/${audioDirectoryName}`,
    projectDirectory: project.directory,
  });
  const captionsPath = await resolveWritableChildPath({
    childPath: path.join(project.directory, captionsFileName),
    displayPath: `projects/${project.id}/${captionsFileName}`,
    projectDirectory: project.directory,
  });

  return {
    audioDirectory,
    captionBlocksPath: captionBlocksRealPath,
    captionsPath,
    directory: project.directory,
    id: project.id,
  };
}

async function loadProjectDirectory(
  request: LoadProjectRequest,
): Promise<{ directory: string; id: string }> {
  const id = resolveProjectId(request.project);
  const rootDirectory = path.resolve(request.rootDirectory);
  const directory = path.join(rootDirectory, projectsDirectoryName, id);
  const projectsDirectory = path.join(rootDirectory, projectsDirectoryName);

  rejectEscapedProjectDirectory({ directory, projectsDirectory });
  const projectsRealPath = await requireDirectory(
    projectsDirectory,
    projectsDirectoryName,
  );
  const directoryRealPath = await requireDirectory(directory, `projects/${id}`);

  rejectEscapedProjectDirectory({
    directory: directoryRealPath,
    projectsDirectory: projectsRealPath,
  });

  return {
    directory: directoryRealPath,
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

  const cleanedReference = projectReference.replace(/[\\/]+$/, '');
  const segments = cleanedReference.split(/[\\/]/);

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
): Promise<string> {
  try {
    const realDirectory = await realpath(directory);
    const stats = await stat(realDirectory);

    if (!stats.isDirectory()) {
      throw new ProjectContractError(`${displayPath} must be a directory.`);
    }

    return realDirectory;
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
): Promise<string> {
  try {
    const realFilePath = await realpath(filePath);
    const stats = await stat(realFilePath);

    if (!stats.isFile()) {
      throw new ProjectContractError(`${displayPath} must be a file.`);
    }

    return realFilePath;
  } catch (error: unknown) {
    if (error instanceof ProjectContractError) {
      throw error;
    }

    throw new ProjectContractError(`${displayPath} is required.`);
  }
}

async function resolveWritableChildPath(request: {
  childPath: string;
  displayPath: string;
  projectDirectory: string;
}): Promise<string> {
  const resolvedPath = path.resolve(request.childPath);
  rejectEscapedProjectDirectory({
    directory: resolvedPath,
    projectsDirectory: request.projectDirectory,
  });

  try {
    const stats = await lstat(resolvedPath);
    if (stats.isSymbolicLink()) {
      throw new ProjectContractError(
        `${request.displayPath} must not be a symlink.`,
      );
    }

    const realPath = await realpath(resolvedPath);
    rejectEscapedProjectDirectory({
      directory: realPath,
      projectsDirectory: request.projectDirectory,
    });
  } catch (error: unknown) {
    if (error instanceof ProjectContractError) {
      throw error;
    }
    if (!isMissingPathError(error)) {
      throw error;
    }
  }

  return resolvedPath;
}

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
