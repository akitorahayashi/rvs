import { z } from 'zod';
import { RuntimeContractError } from '../errors';
import type { NarrationFrameCue } from '../narration/cue';
import type { CaptionCue } from '../subtitles/cue';
import { formatZodError } from '../zod-error';

export const compositionId = 'captioned-short';

const requiredStringSchema = z.string().trim().min(1);
const nonNegativeNumberSchema = z.number().finite().nonnegative();
const positiveNumberSchema = z.number().finite().positive();
const positiveIntegerSchema = z.number().int().positive();
const nonNegativeIntegerSchema = z.number().int().nonnegative();

export const defaultBgmVolume = 0.55;
export const defaultBackgroundVideoVolume = 0.3;
export const defaultNarrationVolume = 1.5;

export const captionCueSchema = z
  .object({
    durationInFrames: positiveIntegerSchema,
    id: requiredStringSchema,
    startFrame: nonNegativeIntegerSchema,
    text: requiredStringSchema,
  })
  .strict();

export const narrationFrameCueSchema = z
  .object({
    audioFile: requiredStringSchema,
    durationInFrames: positiveIntegerSchema,
    id: requiredStringSchema,
    startFrame: nonNegativeIntegerSchema,
  })
  .strict();

export const shortRenderPropsSchema = z
  .object({
    backgroundVideo: requiredStringSchema,
    backgroundVideoVolume: nonNegativeNumberSchema,
    bgm: requiredStringSchema.optional(),
    bgmVolume: nonNegativeNumberSchema,
    captions: z.array(captionCueSchema),
    durationInFrames: positiveIntegerSchema,
    fps: positiveNumberSchema,
    height: positiveIntegerSchema,
    narration: z.array(narrationFrameCueSchema),
    narrationVolume: nonNegativeNumberSchema,
    width: positiveIntegerSchema,
  })
  .strict();

export type ShortRenderProps = z.infer<typeof shortRenderPropsSchema>;

export interface CreateRenderPropsRequest {
  backgroundVideo: string;
  backgroundVideoVolume: number;
  bgm?: string;
  bgmVolume: number;
  captions: CaptionCue[];
  durationInFrames: number;
  fps: number;
  height: number;
  narration: NarrationFrameCue[];
  narrationVolume: number;
  width: number;
}

export const defaultRenderProps = parseShortRenderProps({
  backgroundVideo: 'media/reaction_vertical_short/source/source.mp4',
  backgroundVideoVolume: defaultBackgroundVideoVolume,
  bgm: 'media/bgm/music.mp3',
  bgmVolume: defaultBgmVolume,
  captions: [],
  durationInFrames: 1,
  fps: 30,
  height: 1280,
  narration: [],
  narrationVolume: defaultNarrationVolume,
  width: 720,
});

export function createRenderProps(
  request: CreateRenderPropsRequest,
): ShortRenderProps {
  return parseShortRenderProps(request);
}

export function parseShortRenderProps(props: unknown): ShortRenderProps {
  const result = shortRenderPropsSchema.safeParse(props);
  if (!result.success) {
    throw new RuntimeContractError(
      `Remotion props are invalid: ${formatZodError(result.error)}.`,
    );
  }

  return result.data;
}
