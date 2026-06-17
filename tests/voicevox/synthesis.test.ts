import { afterEach, describe, expect, test } from 'bun:test';
import { MediaContractError } from '../../src/rvs/errors';
import { defaultVoicevoxUrl } from '../../src/rvs/voicevox/engine';
import { narrationProfile } from '../../src/rvs/voicevox/profile';
import { synthesizeWav, voicevoxUrl } from '../../src/rvs/voicevox/synthesis';

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
});

function restoreEnvironment(): void {
  globalThis.fetch = originalFetch;
  if (originalEngineUrl === undefined) {
    delete process.env.RVS_VOICEVOX_ENGINE_URL;
    return;
  }

  process.env.RVS_VOICEVOX_ENGINE_URL = originalEngineUrl;
}
