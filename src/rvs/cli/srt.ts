import type { CAC } from 'cac';
import { writeProjectSrt } from '../app/srt';

export function registerSrtCommand(program: CAC): void {
  program
    .command(
      'srt <project>',
      'Generate project captions.srt from narration audio.',
    )
    .action(async (project: string) => {
      const result = await writeProjectSrt({ project });
      process.stdout.write(`${result.captionsLocation}\n`);
    });
}
