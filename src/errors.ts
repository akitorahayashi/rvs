import { UsageError } from 'clipanion';

export { UsageError as CommandLineError };

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class CaptionBlockContractError extends AppError {}

export class ProjectContractError extends AppError {}

export class SubtitleContractError extends AppError {}

export class MediaContractError extends AppError {}

export class OutputContractError extends AppError {}

export class RuntimeContractError extends AppError {}
