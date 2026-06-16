import { CaptionBlockContractError } from '../errors';

const formatId = 'caption_blocks/v1';
const fileNamePattern = /^\d{2,3}_[^/\\\0]+\.mp3$/u;
const maxTextLength = 15;

export interface CaptionBlock {
  fileName: string;
  text: string;
}

export function parseCaptionBlockDocument(document: unknown): CaptionBlock[] {
  if (!isObject(document)) {
    throw invalidDocument('document must be an object');
  }

  if (document.format !== formatId) {
    throw invalidDocument(`format must be '${formatId}'`);
  }

  if (!Array.isArray(document.blocks) || document.blocks.length === 0) {
    throw invalidDocument('blocks must be a non-empty array');
  }

  const fileNames = new Set<string>();

  return document.blocks
    .map((block, index) => {
      if (!isObject(block)) {
        throw invalidBlock(index + 1, 'block must be an object');
      }

      const fileName = readFileName(block.file_name, index + 1);
      if (fileNames.has(fileName)) {
        throw invalidBlock(index + 1, `file_name '${fileName}' is not unique`);
      }
      fileNames.add(fileName);

      return {
        fileName,
        text: readText(block.text, index + 1),
      };
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName));
}

function readFileName(value: unknown, blockNumber: number): string {
  if (typeof value !== 'string') {
    throw invalidBlock(blockNumber, 'file_name must be a string');
  }

  const fileName = value.trim();
  if (fileName === '') {
    throw invalidBlock(blockNumber, 'file_name must not be empty');
  }

  if (!fileNamePattern.test(fileName)) {
    throw invalidBlock(
      blockNumber,
      'file_name must be a numbered MP3 filename like 01_caption.mp3',
    );
  }

  return fileName;
}

function readText(value: unknown, blockNumber: number): string {
  if (typeof value !== 'string') {
    throw invalidBlock(blockNumber, 'text must be a string');
  }

  const text = value.trim();
  if (text === '') {
    throw invalidBlock(blockNumber, 'text must not be empty');
  }

  if (Array.from(text).length > maxTextLength) {
    throw invalidBlock(
      blockNumber,
      `text must be ${maxTextLength} characters or fewer`,
    );
  }

  return text;
}

function invalidDocument(reason: string): CaptionBlockContractError {
  return new CaptionBlockContractError(
    `caption-blocks.json is invalid: ${reason}.`,
  );
}

function invalidBlock(
  idOrIndex: number,
  reason: string,
): CaptionBlockContractError {
  return new CaptionBlockContractError(
    `caption-blocks.json block ${idOrIndex} is invalid: ${reason}.`,
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
