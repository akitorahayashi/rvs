import { Command, Option } from 'clipanion';
import { runTts } from '../app/tts';
import { CommandLineError } from '../errors';

export class TtsCommand extends Command {
  static override paths = [['tts']];
  static override usage = Command.Usage({
    description: 'Generate project narration MP3 files.',
  });

  project = Option.String({ name: 'project', required: true });
  extra = Option.Rest();

  async execute(): Promise<void> {
    if (this.extra.length > 0) {
      throw new CommandLineError(
        `Unexpected positional arguments: ${this.extra.join(', ')}.`,
      );
    }
    const result = await runTts({ project: this.project });
    process.stdout.write(`${result.audioLocation}\n`);
  }
}
