import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { OutputContractError } from '../errors';

const outputDirectoryName = 'output';
const maxCollisionSuffix = 999;

export interface CreateOutputPathRequest {
  now?: Date;
  projectId: string;
  rootDirectory: string;
}

export async function createOutputPath(
  request: CreateOutputPathRequest,
): Promise<string> {
  const directory = path.join(
    path.resolve(request.rootDirectory),
    outputDirectoryName,
    request.projectId,
  );
  await mkdir(directory, { recursive: true });

  const timestamp = formatTimestamp(request.now ?? new Date());

  for (let suffix = 0; suffix <= maxCollisionSuffix; suffix += 1) {
    const fileName =
      suffix === 0
        ? `${timestamp}.mp4`
        : `${timestamp}-${String(suffix).padStart(3, '0')}.mp4`;
    const outputPath = path.join(directory, fileName);

    if (!(await pathExists(outputPath))) {
      return outputPath;
    }
  }

  throw new OutputContractError(
    `No output filename is available for ${request.projectId} at ${timestamp}.`,
  );
}

function formatTimestamp(date: Date): string {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch (error: unknown) {
    if (isMissingPathError(error)) {
      return false;
    }

    throw error;
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
