const defaultEngineHost = '127.0.0.1';
const defaultEnginePort = 50021;

export function defaultVoicevoxUrl(): string {
  return `http://${defaultEngineHost}:${defaultEnginePort}`;
}
