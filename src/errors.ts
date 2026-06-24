import { AppError, CommandLineError } from 'cli-kit';

export { AppError, CommandLineError };

export class CaptionBlockContractError extends AppError {}

export class ProjectContractError extends AppError {}

export class SubtitleContractError extends AppError {}

export class MediaContractError extends AppError {}

export class OutputContractError extends AppError {}

export class RuntimeContractError extends AppError {}
