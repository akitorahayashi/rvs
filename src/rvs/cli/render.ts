import type { CAC } from 'cli-kit';
import { renderProject } from '../app/render';

export function registerRenderCommand(program: CAC): void {
  program
    .command('render <project>', 'Render one project into a captioned MP4.')
    .action(async (project: string) => {
      const result = await renderProject({ project });
      process.stdout.write(`${result.outputLocation}\n`);
    });
}
