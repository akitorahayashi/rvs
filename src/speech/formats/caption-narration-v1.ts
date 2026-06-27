import type { VoicevoxProfile } from 'vcvx-ts';
import { z } from 'zod';
import type { SpeechClip, TtsFormat } from '../format';

const formatId = 'caption_narration/v1';
const outputFormat = 'mp3';
const fileNamePattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/u;
const maxCaptionLength = 15;
const lineBreakPattern = /\r\n?|\n/gu;

const captionBlockSchema = z
  .object({
    caption: z.string().trim().min(1).superRefine(validateCaptionDisplayText),
    file_name: z.string().trim().regex(fileNamePattern),
    narration: z.string().trim().min(1),
  })
  .strict()
  .transform((block) => ({
    caption: block.caption,
    fileName: block.file_name,
    narration: block.narration,
  }));

const captionDocumentSchema = z
  .object({
    blocks: z.array(captionBlockSchema).nonempty(),
    tts_format: z.literal(formatId),
  })
  .strict()
  .transform((document) => document.blocks);

export type CaptionBlock = z.infer<typeof captionBlockSchema>;

export interface CaptionBlockAudioAsset {
  block: CaptionBlock;
  fileName: string;
  id: string;
}

export const narrationProfile: VoicevoxProfile = {
  intonationScale: 1,
  pitchScale: 0,
  postPhonemeLength: 0,
  prePhonemeLength: 0,
  speakerId: 2,
  speedScale: 1.15,
  volumeScale: 1,
};

export const captionNarrationV1: TtsFormat = {
  id: formatId,
  loadClips,
  loadSpeakerId,
  voicevoxProfile: narrationProfile,
};

export function parseCaptionBlocks(document: unknown): CaptionBlock[] {
  const result = captionDocumentSchema.safeParse(document);
  if (!result.success) {
    throw invalidInput(z.prettifyError(result.error));
  }

  validateUniqueFileNames(result.data);
  return result.data;
}

export function buildCaptionBlockAudioAssets(
  blocks: readonly CaptionBlock[],
): CaptionBlockAudioAsset[] {
  return blocks.map((block, index) => ({
    block,
    fileName: captionBlockAudioFileName(index, block.fileName),
    id: String(index + 1),
  }));
}

export function captionBlockAudioFileName(index: number, name: string): string {
  return `${String(index + 1).padStart(2, '0')}_${name}.${outputFormat}`;
}

function loadClips(document: unknown): SpeechClip[] {
  return buildCaptionBlockAudioAssets(parseCaptionBlocks(document)).map(
    (asset, index) => ({
      index: index + 1,
      outputFileName: asset.fileName,
      text: asset.block.narration,
    }),
  );
}

function loadSpeakerId(): number | undefined {
  return undefined;
}

function validateUniqueFileNames(blocks: readonly CaptionBlock[]): void {
  const fileNames = new Set<string>();
  for (const [index, block] of blocks.entries()) {
    if (fileNames.has(block.fileName)) {
      throw invalidInput(
        `block ${index + 1} has duplicate file_name '${block.fileName}'`,
      );
    }
    fileNames.add(block.fileName);
  }
}

function validateCaptionDisplayText(
  caption: string,
  context: z.RefinementCtx,
): void {
  const displayTextLength = caption.replace(lineBreakPattern, '').length;
  if (displayTextLength > maxCaptionLength) {
    context.addIssue({
      code: 'too_big',
      maximum: maxCaptionLength,
      message: `caption display text must contain at most ${maxCaptionLength} characters`,
      origin: 'string',
      inclusive: true,
      input: caption,
    });
  }

  for (const line of caption.split(lineBreakPattern)) {
    if (line.trim() === '') {
      context.addIssue({
        code: 'custom',
        message: 'caption lines must not be empty',
      });
      return;
    }
  }
}

function invalidInput(reason: string): Error {
  return new Error(`TTS input is invalid for ${formatId}: ${reason}`);
}
