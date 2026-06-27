import { z } from 'zod';
import { CaptionContractError } from '../errors';
import { formatZodError } from '../zod-error';

const formatId = 'caption_narration/v1';
const fileNamePattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/u;
const lineBreakPattern = /\r\n?|\n/gu;
const maxCaptionLength = 15;

function requiredTextSchema(fieldName: string) {
  return z.string().trim().min(1, `${fieldName} must not be empty`);
}

const captionSchema = requiredTextSchema('caption').superRefine(
  validateCaptionDisplayText,
);
const fileNameSchema = requiredTextSchema('file_name').regex(
  fileNamePattern,
  'file_name must be a lower snake name without a number or extension',
);

const captionBlockSchema = z
  .object({
    caption: captionSchema,
    file_name: fileNameSchema,
    narration: requiredTextSchema('narration'),
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

export function parseCaptionDocument(document: unknown): CaptionBlock[] {
  const blocks = parseCaptionShape(document);
  validateCaptionRules(blocks);

  return blocks;
}

function parseCaptionShape(document: unknown): CaptionBlock[] {
  const result = captionDocumentSchema.safeParse(document);
  if (!result.success) {
    throw invalidDocument(
      formatZodError(result.error, { numberPathOffset: 1 }),
    );
  }

  return result.data;
}

function validateCaptionRules(blocks: readonly CaptionBlock[]): void {
  const fileNames = new Set<string>();

  for (const [index, block] of blocks.entries()) {
    if (fileNames.has(block.fileName)) {
      throw invalidBlock(
        index + 1,
        `file_name '${block.fileName}' is not unique`,
      );
    }
    fileNames.add(block.fileName);
  }
}

function validateCaptionDisplayText(
  caption: string,
  context: z.RefinementCtx,
): void {
  const displayTextLength = Array.from(
    caption.replace(lineBreakPattern, ''),
  ).length;
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

function invalidDocument(reason: string): CaptionContractError {
  return new CaptionContractError(`captions JSON is invalid: ${reason}.`);
}

function invalidBlock(idOrIndex: number, reason: string): CaptionContractError {
  return new CaptionContractError(
    `captions JSON block ${idOrIndex} is invalid: ${reason}.`,
  );
}
