import { z } from 'zod';
import { MediaContractError } from '../errors';
import { formatZodError } from '../zod-error';
import { defaultVoicevoxUrl } from './engine';
import { parseVoicevoxProfile, type VoicevoxProfile } from './profile';

const voicevoxUrlSchema = z
  .string()
  .trim()
  .min(1, 'must be a non-empty URL')
  .url('must be a valid URL')
  .refine((url) => {
    try {
      const protocol = new URL(url).protocol;
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return true;
    }
  }, 'must use HTTP or HTTPS');

const audioQueryResponseSchema = z.record(z.string(), z.unknown());

export function voicevoxUrl(): string {
  const configuredUrl = process.env.RVS_VOICEVOX_ENGINE_URL;
  if (configuredUrl === undefined) {
    return defaultVoicevoxUrl();
  }

  const result = voicevoxUrlSchema.safeParse(configuredUrl);
  if (!result.success) {
    throw new MediaContractError(
      `RVS_VOICEVOX_ENGINE_URL ${formatZodError(result.error)}.`,
    );
  }

  return result.data;
}

export async function synthesizeWav(
  engineUrl: string,
  text: string,
  profile: VoicevoxProfile,
): Promise<Uint8Array> {
  const voicevoxProfile = parseVoicevoxProfile(profile);
  const normalizedEngineUrl = engineUrl.replace(/\/+$/u, '');
  const audioQuery = await requestAudioQuery({
    engineUrl: normalizedEngineUrl,
    profile: voicevoxProfile,
    text,
  });

  const synthesisPayload = {
    ...audioQuery,
    intonationScale: voicevoxProfile.intonationScale,
    pitchScale: voicevoxProfile.pitchScale,
    postPhonemeLength: voicevoxProfile.postPhonemeLength,
    prePhonemeLength: voicevoxProfile.prePhonemeLength,
    speedScale: voicevoxProfile.speedScale,
    volumeScale: voicevoxProfile.volumeScale,
  };

  const synthesisUrl = new URL(`${normalizedEngineUrl}/synthesis`);
  synthesisUrl.searchParams.set(
    'speaker',
    voicevoxProfile.speakerId.toString(),
  );

  const response = await fetchVoicevox(synthesisUrl, {
    body: JSON.stringify(synthesisPayload),
    context: 'synthesis',
  });

  if (!response.ok) {
    throw new MediaContractError(
      `VOICEVOX synthesis failed: ${response.status}`,
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function requestAudioQuery(request: {
  engineUrl: string;
  profile: VoicevoxProfile;
  text: string;
}): Promise<Record<string, unknown>> {
  const audioQueryUrl = new URL(`${request.engineUrl}/audio_query`);
  audioQueryUrl.searchParams.set('text', request.text);
  audioQueryUrl.searchParams.set(
    'speaker',
    request.profile.speakerId.toString(),
  );

  const response = await fetchVoicevox(audioQueryUrl, {
    body: '{}',
    context: 'audio_query',
  });

  if (!response.ok) {
    throw new MediaContractError(
      `VOICEVOX audio_query failed: ${response.status}`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MediaContractError(
      `VOICEVOX audio_query returned invalid JSON: ${message}`,
    );
  }

  const result = audioQueryResponseSchema.safeParse(payload);
  if (!result.success) {
    throw new MediaContractError(
      `VOICEVOX returned an invalid audio query payload: ${formatZodError(result.error)}.`,
    );
  }

  return result.data;
}

async function fetchVoicevox(
  url: URL,
  request: { body: string; context: string },
): Promise<Response> {
  try {
    return await fetch(url, {
      body: request.body,
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MediaContractError(
      `VOICEVOX ${request.context} request failed: ${message}`,
    );
  }
}
