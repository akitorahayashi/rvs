import { afterEach, describe, expect, test } from 'bun:test';
import { MediaContractError } from '../src/errors';
import { narrationProfile } from '../src/speech/formats/caption-narration-v1';
import { defaultVoicevoxUrl } from '../src/voicevox/engine';
import { synthesizeWav, voicevoxUrl } from '../src/voicevox/synthesis';

const originalFetch = globalThis.fetch;
const originalEngineUrl = process.env.RVS_VOICEVOX_ENGINE_URL;

describe('voicevoxUrl', () => {
  afterEach(() => {
    restoreEnvironment();
  });

  test('rejects a blank configured engine URL', () => {
    process.env.RVS_VOICEVOX_ENGINE_URL = '   ';

    expect(() => voicevoxUrl()).toThrow(MediaContractError);
  });

  test('trims a configured engine URL', () => {
    process.env.RVS_VOICEVOX_ENGINE_URL = ' http://127.0.0.1:50021/ ';

    expect(voicevoxUrl()).toBe('http://127.0.0.1:50021/');
  });

  test('rejects an invalid configured engine URL', () => {
    process.env.RVS_VOICEVOX_ENGINE_URL = 'not-a-url';

    expect(() => voicevoxUrl()).toThrow(MediaContractError);
  });

  test('rejects non-HTTP configured engine URLs', () => {
    process.env.RVS_VOICEVOX_ENGINE_URL = 'file:///tmp/voicevox';

    expect(() => voicevoxUrl()).toThrow('HTTP or HTTPS');
  });

  test('falls back to the default URL when unconfigured', () => {
    delete process.env.RVS_VOICEVOX_ENGINE_URL;

    expect(voicevoxUrl()).toBe(defaultVoicevoxUrl());
  });
});

describe('synthesizeWav', () => {
  afterEach(() => {
    restoreEnvironment();
  });

  test('wraps VOICEVOX request failures', async () => {
    globalThis.fetch = (async () => {
      throw new Error('connection refused');
    }) as unknown as typeof fetch;

    await expect(
      synthesizeWav('http://127.0.0.1:50021', 'hello', narrationProfile),
    ).rejects.toThrow('VOICEVOX audio_query request failed');
  });

  test('preserves unknown audio query response properties', async () => {
    let synthesisBody: Record<string, unknown> | undefined;

    globalThis.fetch = (async (
      url: Parameters<typeof fetch>[0],
      init?: RequestInit,
    ) => {
      const requestUrl = new URL(String(url));
      if (requestUrl.pathname === '/audio_query') {
        return new Response(
          JSON.stringify({
            accent_phrases: [],
            engine_specific: 'kept',
          }),
          { status: 200 },
        );
      }

      synthesisBody = JSON.parse(String(init?.body));
      return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
    }) as unknown as typeof fetch;

    await synthesizeWav('http://127.0.0.1:50021', 'hello', narrationProfile);

    expect(synthesisBody).toMatchObject({
      engine_specific: 'kept',
      speedScale: narrationProfile.speedScale,
    });
  });

  test('distinguishes invalid audio query JSON from schema violations', async () => {
    globalThis.fetch = (async () => {
      return new Response('{', { status: 200 });
    }) as unknown as typeof fetch;

    await expect(
      synthesizeWav('http://127.0.0.1:50021', 'hello', narrationProfile),
    ).rejects.toThrow('invalid JSON');

    globalThis.fetch = (async () => {
      return new Response('[]', { status: 200 });
    }) as unknown as typeof fetch;

    await expect(
      synthesizeWav('http://127.0.0.1:50021', 'hello', narrationProfile),
    ).rejects.toThrow('invalid audio query payload');
  });
});

function restoreEnvironment(): void {
  globalThis.fetch = originalFetch;
  if (originalEngineUrl === undefined) {
    delete process.env.RVS_VOICEVOX_ENGINE_URL;
    return;
  }

  process.env.RVS_VOICEVOX_ENGINE_URL = originalEngineUrl;
}
