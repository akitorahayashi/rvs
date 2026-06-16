import { MediaContractError } from '../errors';
import { defaultVoicevoxUrl } from './engine';
import type { VoicevoxProfile } from './profile';

export function voicevoxUrl(): string {
  const configuredUrl = process.env.RVS_VOICEVOX_ENGINE_URL;
  if (configuredUrl === undefined) {
    return defaultVoicevoxUrl();
  }

  const url = configuredUrl.trim();
  if (url === '') {
    throw new MediaContractError(
      'RVS_VOICEVOX_ENGINE_URL must be a non-empty URL.',
    );
  }

  try {
    new URL(url);
  } catch {
    throw new MediaContractError(
      'RVS_VOICEVOX_ENGINE_URL must be a valid URL.',
    );
  }

  return url;
}

export async function synthesizeWav(
  engineUrl: string,
  text: string,
  profile: VoicevoxProfile,
): Promise<Uint8Array> {
  const normalizedEngineUrl = engineUrl.replace(/\/+$/u, '');
  const audioQuery = await requestAudioQuery({
    engineUrl: normalizedEngineUrl,
    profile,
    text,
  });

  const synthesisPayload = {
    ...audioQuery,
    intonationScale: profile.intonationScale,
    pitchScale: profile.pitchScale,
    postPhonemeLength: profile.postPhonemeLength,
    prePhonemeLength: profile.prePhonemeLength,
    speedScale: profile.speedScale,
    volumeScale: profile.volumeScale,
  };

  const synthesisUrl = new URL(`${normalizedEngineUrl}/synthesis`);
  synthesisUrl.searchParams.set('speaker', profile.speakerId.toString());

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

  const payload: unknown = await response.json();
  if (!isObject(payload)) {
    throw new MediaContractError(
      'VOICEVOX returned an invalid audio query payload.',
    );
  }

  return payload;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
