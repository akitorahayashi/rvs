import { readFile } from 'node:fs/promises';
import { CaptionContractError } from '../errors';
import { type CaptionBlock, parseCaptionDocument } from './document';

export async function readCaptions(
  captionsPath: string,
): Promise<CaptionBlock[]> {
  let source: string;

  try {
    source = await readFile(captionsPath, 'utf8');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CaptionContractError(
      `captions JSON could not be read: ${message}`,
    );
  }

  let document: unknown;
  try {
    document = JSON.parse(source);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CaptionContractError(`captions JSON is invalid JSON: ${message}`);
  }

  return parseCaptionDocument(document);
}
