const defaultEngineHost = '127.0.0.1';
const defaultEnginePort = 50021;
const defaultContainerName = 'rvs-voicevox';
const defaultImage = 'voicevox/voicevox_engine:cpu-ubuntu22.04-0.25.0';

export function defaultVoicevoxUrl(): string {
  return `http://${defaultEngineHost}:${defaultEnginePort}`;
}

export function voicevoxDockerCommand(): string[] {
  return [
    'docker',
    'run',
    '--rm',
    '--init',
    '-p',
    `${defaultEngineHost}:${defaultEnginePort}:${defaultEnginePort}`,
    '--name',
    defaultContainerName,
    defaultImage,
  ];
}
