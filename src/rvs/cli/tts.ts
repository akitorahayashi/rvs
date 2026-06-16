import type { CAC } from 'cac';
import { runTts } from '../app/tts';

export function registerTtsCommand(program: CAC): void {
  program
    .command('tts <project>', 'Generate project narration MP3 files.')
    .action(async (project: string) => {
      const result = await runTts({ project });
      process.stdout.write(`${result.audioLocation}\n`);
    });
}
