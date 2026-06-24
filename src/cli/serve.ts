import { Command, Option } from 'clipanion';
import { runServe } from '../app/serve';
import { CommandLineError } from '../errors';

export class ServeCommand extends Command {
  static override paths = [['serve'], ['s']];
  static override usage = Command.Usage({
    description: 'Start the local VOICEVOX engine container.',
  });

  extra = Option.Rest();

  async execute(): Promise<void> {
    if (this.extra.length > 0) {
      throw new CommandLineError(
        `Unexpected positional arguments: ${this.extra.join(', ')}.`,
      );
    }
    await runServe();
  }
}
