import { readFile } from 'node:fs/promises';
import {
  type CaptionBlock,
  parseCaptionBlocks,
} from '../speech/formats/caption-narration-v1';

export type { CaptionBlock };

export async function readCaptionBlocks(
  captionsPath: string,
): Promise<CaptionBlock[]> {
  const source = await readCaptionsSource(captionsPath);
  const document = parseJson(source, captionsPath);
  try {
    return parseCaptionBlocks(document);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${captionsPath} is invalid: ${message}`);
  }
}

async function readCaptionsSource(captionsPath: string): Promise<string> {
  try {
    return await readFile(captionsPath, 'utf8');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${captionsPath} could not be read: ${message}`);
  }
}

function parseJson(source: string, captionsPath: string): unknown {
  try {
    return JSON.parse(source);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${captionsPath} is invalid JSON: ${message}`);
  }
}
