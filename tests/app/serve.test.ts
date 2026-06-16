import { describe, expect, test } from 'bun:test';
import { runServe } from '../../src/rvs/app/serve';

describe('runServe', () => {
  test('starts the VOICEVOX engine container with the expected docker command', async () => {
    const calls: Array<{
      cmd: string[];
      options: {
        stderr: 'inherit';
        stdin: 'inherit';
        stdout: 'inherit';
      };
    }> = [];

    await runServe({
      spawn: (cmd, options) => {
        calls.push({ cmd, options });
        return {
          exited: Promise.resolve(0),
        };
      },
    });

    expect(calls).toEqual([
      {
        cmd: [
          'docker',
          'run',
          '--rm',
          '--init',
          '-p',
          '127.0.0.1:50021:50021',
          '--name',
          'rvs-voicevox',
          'voicevox/voicevox_engine:cpu-ubuntu22.04-0.25.0',
        ],
        options: {
          stderr: 'inherit',
          stdin: 'inherit',
          stdout: 'inherit',
        },
      },
    ]);
  });

  test('fails when docker is unavailable', async () => {
    await expect(
      runServe({
        spawn: () => {
          const error = new Error('spawn docker ENOENT') as Error & {
            code: string;
          };
          error.code = 'ENOENT';
          throw error;
        },
      }),
    ).rejects.toThrow('docker is required but was not found.');
  });

  test('fails when the engine container exits with a non-zero code', async () => {
    await expect(
      runServe({
        spawn: () => ({
          exited: Promise.resolve(125),
        }),
      }),
    ).rejects.toThrow('VOICEVOX engine container exited with code 125.');
  });
});
