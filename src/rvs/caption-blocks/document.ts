import { z } from 'zod';
import { CaptionBlockContractError } from '../errors';

const formatId = 'caption_blocks/v1';
const fileNamePattern = /^\d{2,3}_[^/\\\0]+\.mp3$/u;
const maxCaptionLength = 15;

function requiredTextSchema(fieldName: string) {
  return z.string().trim().min(1, `${fieldName} must not be empty`);
}

const captionSchema = requiredTextSchema('caption').refine(
  (caption) => Array.from(caption).length <= maxCaptionLength,
  `caption must be ${maxCaptionLength} characters or fewer`,
);
const fileNameSchema = requiredTextSchema('file_name').regex(
  fileNamePattern,
  'file_name must be a numbered MP3 filename like 01_caption.mp3',
);

const captionBlockSchema = z
  .object({
    caption: captionSchema,
    file_name: fileNameSchema,
    narration: requiredTextSchema('narration').optional(),
  })
  .strict()
  .transform((block) => ({
    caption: block.caption,
    fileName: block.file_name,
    narration: block.narration,
  }));

const captionBlockDocumentSchema = z
  .object({
    blocks: z.array(captionBlockSchema).nonempty(),
    format: z.literal(formatId),
  })
  .strict()
  .transform((document) => document.blocks);

export type CaptionBlock = z.infer<typeof captionBlockSchema>;

export function parseCaptionBlockDocument(document: unknown): CaptionBlock[] {
  const blocks = parseCaptionBlockShape(document);
  validateCaptionBlockRules(blocks);

  return blocks;
}

function parseCaptionBlockShape(document: unknown): CaptionBlock[] {
  const result = captionBlockDocumentSchema.safeParse(document);
  if (!result.success) {
    throw invalidDocument(formatZodError(result.error));
  }

  return result.data;
}

function validateCaptionBlockRules(blocks: readonly CaptionBlock[]): void {
  const fileNames = new Set<string>();

  for (const [index, block] of blocks.entries()) {
    if (readFileNumber(block.fileName) !== index + 1) {
      throw invalidBlock(
        index + 1,
        'file_name number must match the block position',
      );
    }

    if (fileNames.has(block.fileName)) {
      throw invalidBlock(
        index + 1,
        `file_name '${block.fileName}' is not unique`,
      );
    }
    fileNames.add(block.fileName);
  }
}

function readFileNumber(fileName: string): number {
  return Number.parseInt(fileName, 10);
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

function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (issue === undefined) {
    return 'schema validation failed';
  }

  const path = issue.path
    .map((segment) => (typeof segment === 'number' ? segment + 1 : segment))
    .join('.');

  if (path === '') {
    return issue.message;
  }

  return `${path}: ${issue.message}`;
}
