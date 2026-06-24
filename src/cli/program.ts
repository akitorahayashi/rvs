import { type CAC, runCli } from 'cli-kit';
import packageMetadata from '../../package.json';
import { registerRenderCommand } from './render';
import { registerServeCommand } from './serve';
import { registerTtsCommand } from './tts';

export function runCommandLine(
  args: readonly string[] = Bun.argv.slice(2),
): Promise<number> {
  return runCli({
    bin: packageMetadata.name,
    version: packageMetadata.version,
    tagline: packageMetadata.description,
    register: (program: CAC) => {
      registerServeCommand(program);
      registerTtsCommand(program);
      registerRenderCommand(program);
    },
    argv: args,
  });
}
