import { z } from 'zod';
import { MediaContractError } from '../errors';
import { formatZodError } from '../zod-error';

const finiteNumberSchema = z.number().finite();

export const voicevoxProfileSchema = z
  .object({
    intonationScale: finiteNumberSchema,
    pitchScale: finiteNumberSchema,
    postPhonemeLength: finiteNumberSchema,
    prePhonemeLength: finiteNumberSchema,
    speakerId: z.number().int().nonnegative(),
    speedScale: finiteNumberSchema,
    volumeScale: finiteNumberSchema,
  })
  .strict();

export type VoicevoxProfile = z.infer<typeof voicevoxProfileSchema>;

export const narrationProfile = parseVoicevoxProfile({
  intonationScale: 1.0,
  pitchScale: 0.0,
  postPhonemeLength: 0.0,
  prePhonemeLength: 0.0,
  speakerId: 2,
  speedScale: 1.15,
  volumeScale: 1.0,
});

export function parseVoicevoxProfile(profile: unknown): VoicevoxProfile {
  const result = voicevoxProfileSchema.safeParse(profile);
  if (!result.success) {
    throw new MediaContractError(
      `VOICEVOX profile is invalid: ${formatZodError(result.error)}.`,
    );
  }

  return result.data;
}
