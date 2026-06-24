import { RuntimeContractError } from '../errors';
import { voicevoxDockerCommand } from '../voicevox/engine';

interface SpawnedProcess {
  exited: Promise<number>;
}

type SpawnProcess = (
  cmd: string[],
  options: {
    stderr: 'inherit';
    stdin: 'inherit';
    stdout: 'inherit';
  },
) => SpawnedProcess;

export interface RunServeRequest {
  spawn?: SpawnProcess;
}

export async function runServe(request: RunServeRequest = {}): Promise<void> {
  const spawn = request.spawn ?? Bun.spawn;
  let process: SpawnedProcess;

  try {
    process = spawn(voicevoxDockerCommand(), {
      stderr: 'inherit',
      stdin: 'inherit',
      stdout: 'inherit',
    });
  } catch (error: unknown) {
    if (isMissingExecutable(error)) {
      throw new RuntimeContractError('docker is required but was not found.');
    }

    throw error;
  }

  const exitCode = await process.exited;
  if (exitCode === 0) {
    return;
  }

  throw new RuntimeContractError(
    `VOICEVOX engine container exited with code ${exitCode}.`,
  );
}

function isMissingExecutable(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}
