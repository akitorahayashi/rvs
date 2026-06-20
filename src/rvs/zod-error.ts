import type { ZodError } from 'zod';

export interface FormatZodErrorOptions {
  numberPathOffset?: number;
}

export function formatZodError(
  error: ZodError,
  options: FormatZodErrorOptions = {},
): string {
  const issue = error.issues[0];
  if (issue === undefined) {
    return 'schema validation failed';
  }

  const path = issue.path
    .map((segment) =>
      typeof segment === 'number'
        ? segment + (options.numberPathOffset ?? 0)
        : segment,
    )
    .join('.');

  if (path === '') {
    return issue.message;
  }

  return `${path}: ${issue.message}`;
}
