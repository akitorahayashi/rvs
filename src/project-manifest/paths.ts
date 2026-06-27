import path from 'node:path';
import { z } from 'zod';
import { ProjectContractError } from '../errors';

export const projectFileSuffix = '.project.ts';
export const projectIdPattern = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export const fileNameSchema = z.string().trim().min(1).refine(isFileName, {
  message: 'must be a file name, not a path',
});

export function isFileName(value: string): boolean {
  return (
    value !== '.' &&
    value !== '..' &&
    !/[\\/]/u.test(value) &&
    path.basename(value) === value
  );
}

export function rejectEscapedRoot(request: {
  displayPath: string;
  rootDirectory: string;
  targetPath: string;
}): void {
  const relativePath = path.relative(request.rootDirectory, request.targetPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new ProjectContractError(
      `${request.displayPath} must stay inside the repository root.`,
    );
  }
}
