import { Command, Option } from 'clipanion';
import { renderProject } from '../app/render';
import { CommandLineError } from '../errors';

export class RenderCommand extends Command {
  static override paths = [['render']];
  static override usage = Command.Usage({
    description: 'Render one project manifest into a captioned MP4.',
  });

  project = Option.String({ name: 'project-file', required: true });
  extra = Option.Rest();

  async execute(): Promise<void> {
    if (this.extra.length > 0) {
      throw new CommandLineError(
        `Unexpected positional arguments: ${this.extra.join(', ')}.`,
      );
    }
    const result = await renderProject({ project: this.project });
    process.stdout.write(`${result.outputLocation}\n`);
  }
}
