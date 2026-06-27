import { Command, Option } from 'clipanion';
import { runTts } from '../app/tts';
import { CommandLineError } from '../errors';

export class TtsCommand extends Command {
  static override paths = [['tts']];
  static override usage = Command.Usage({
    description: 'Generate narration MP3 files for one captions JSON file.',
  });

  captions = Option.String({ name: 'captions-file', required: true });
  extra = Option.Rest();

  async execute(): Promise<void> {
    if (this.extra.length > 0) {
      throw new CommandLineError(
        `Unexpected positional arguments: ${this.extra.join(', ')}.`,
      );
    }
    const result = await runTts({ captions: this.captions });
    process.stdout.write(`${result.narrationLocation}\n`);
  }
}
