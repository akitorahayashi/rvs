import type { TtsFormat } from './format';
import { captionNarrationV1 } from './formats/caption-narration-v1';

const definitions: readonly TtsFormat[] = [captionNarrationV1];
const formats = registerFormats(definitions);

export function resolveTtsFormat(document: unknown): TtsFormat {
  const id = readFormatId(document);
  const format = formats.get(id);
  if (!format) {
    throw new Error(`Unsupported tts_format: ${id}`);
  }
  return format;
}

function readFormatId(document: unknown): string {
  if (!document || typeof document !== 'object') {
    throw new Error('TTS input is invalid: tts_format is required');
  }

  const id = (document as { tts_format?: unknown }).tts_format;
  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error('TTS input is invalid: tts_format is required');
  }
  return id;
}

function registerFormats(
  registered: readonly TtsFormat[],
): ReadonlyMap<string, TtsFormat> {
  const result = new Map<string, TtsFormat>();
  for (const format of registered) {
    if (result.has(format.id)) {
      throw new Error(`Duplicate tts_format registration: ${format.id}`);
    }
    result.set(format.id, format);
  }
  return result;
}
