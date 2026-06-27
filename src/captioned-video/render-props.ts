import { z } from 'zod';
import { RuntimeContractError } from '../errors';
import { formatZodError } from '../zod-error';

export const captionedVideoCompositionId = 'captioned-video';

const requiredStringSchema = z.string().trim().min(1);
const nonNegativeNumberSchema = z.number().finite().nonnegative();
const positiveNumberSchema = z.number().finite().positive();
const positiveIntegerSchema = z.number().int().positive();
const nonNegativeIntegerSchema = z.number().int().nonnegative();

const frameCueSchema = z
  .object({
    durationInFrames: positiveIntegerSchema,
    id: requiredStringSchema,
    startFrame: nonNegativeIntegerSchema,
    text: requiredStringSchema,
  })
  .strict();

const narrationCueSchema = z
  .object({
    audioFile: requiredStringSchema,
    durationInFrames: positiveIntegerSchema,
    id: requiredStringSchema,
    startFrame: nonNegativeIntegerSchema,
  })
  .strict();

const bottomBandPositionSchema = z
  .object({
    bottomPercent: nonNegativeNumberSchema,
    horizontalInset: nonNegativeNumberSchema,
    type: z.literal('bottomBand'),
  })
  .strict();

export const captionedVideoRenderPropsSchema = z
  .object({
    bgm: requiredStringSchema,
    bgmVolume: nonNegativeNumberSchema,
    captions: z.array(frameCueSchema),
    captionPosition: bottomBandPositionSchema,
    captionStrokeWidthPx: nonNegativeNumberSchema,
    durationInFrames: positiveIntegerSchema,
    fps: positiveNumberSchema,
    height: positiveIntegerSchema,
    narration: z.array(narrationCueSchema),
    narrationVolume: nonNegativeNumberSchema,
    sourceVideo: requiredStringSchema,
    sourceVideoVolume: nonNegativeNumberSchema,
    width: positiveIntegerSchema,
  })
  .strict();

export type CaptionFrameCue = z.infer<typeof frameCueSchema>;
export type NarrationFrameCue = z.infer<typeof narrationCueSchema>;
export type CaptionedVideoRenderProps = z.infer<
  typeof captionedVideoRenderPropsSchema
>;

export const defaultCaptionedVideoRenderProps = parseCaptionedVideoRenderProps({
  bgm: 'media/bgm/music.mp3',
  bgmVolume: 0.55,
  captions: [],
  captionPosition: {
    bottomPercent: 18,
    horizontalInset: 48,
    type: 'bottomBand',
  },
  captionStrokeWidthPx: 0,
  durationInFrames: 1,
  fps: 30,
  height: 1280,
  narration: [],
  narrationVolume: 1.5,
  sourceVideo: 'media/reaction_vertical_short/source/source.mp4',
  sourceVideoVolume: 0.3,
  width: 720,
});

export function parseCaptionedVideoRenderProps(
  props: unknown,
): CaptionedVideoRenderProps {
  const result = captionedVideoRenderPropsSchema.safeParse(props);
  if (!result.success) {
    throw new RuntimeContractError(
      `Captioned video render props are invalid: ${formatZodError(result.error)}.`,
    );
  }

  return result.data;
}
