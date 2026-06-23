import type { CAC } from 'cli-kit';
import { runServe } from '../app/serve';

export function registerServeCommand(program: CAC): void {
  program
    .command('serve', 'Start the local VOICEVOX engine container.')
    .alias('s')
    .action(async () => {
      await runServe();
    });
}
