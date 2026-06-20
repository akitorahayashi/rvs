import { z } from 'zod';
import { CaptionBlockContractError } from '../errors';
import { formatZodError } from '../zod-error';

const formatId = 'caption_blocks/v1';
const fileNamePattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/u;
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
  'file_name must be a lower snake name without a number or extension',
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
    throw invalidDocument(
      formatZodError(result.error, { numberPathOffset: 1 }),
    );
  }

  return result.data;
}

function validateCaptionBlockRules(blocks: readonly CaptionBlock[]): void {
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
