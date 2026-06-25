#!/usr/bin/env bun

import { Builtins, Cli } from 'clipanion';
import packageMetadata from '../package.json';
import { RenderCommand } from './cli/render';
import { TtsCommand } from './cli/tts';

function createCli(): Cli {
  const cli = new Cli({
    binaryLabel: packageMetadata.description,
    binaryName: packageMetadata.name,
    binaryVersion: packageMetadata.version,
  });
  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);
  cli.register(TtsCommand);
  cli.register(RenderCommand);
  return cli;
}

export function runCommandLine(
  args: readonly string[] = Bun.argv.slice(2),
): Promise<number> {
  return createCli().run(args.length === 0 ? ['--help'] : [...args]);
}

if (import.meta.main) {
  process.exitCode = await runCommandLine();
}
