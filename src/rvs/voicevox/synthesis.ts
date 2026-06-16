import { MediaContractError } from '../errors';
import type { VoicevoxProfile } from './profile';

const defaultEngineUrl = 'http://127.0.0.1:50021';

export function voicevoxUrl(): string {
  return process.env.RVS_VOICEVOX_ENGINE_URL ?? defaultEngineUrl;
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

  const response = await fetch(synthesisUrl, {
    body: JSON.stringify(synthesisPayload),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
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

  const response = await fetch(audioQueryUrl, {
    body: '{}',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
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
