import { readFile } from 'node:fs/promises';
import { CaptionBlockContractError } from '../errors';
import { type CaptionBlock, parseCaptionBlockDocument } from './document';

export async function readCaptionBlocks(
  captionBlocksPath: string,
): Promise<CaptionBlock[]> {
  let document: unknown;

  try {
    document = JSON.parse(await readFile(captionBlocksPath, 'utf8'));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CaptionBlockContractError(
      `caption-blocks.json is invalid JSON: ${message}`,
    );
  }

  return parseCaptionBlockDocument(document);
}
