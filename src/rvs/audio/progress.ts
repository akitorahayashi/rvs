export interface NarrationProgress {
  advance(): void;
  finish(): void;
}

interface ProgressStream {
  write(text: string): void;
  isTty: boolean;
}

const barWidth = 24;

export function createNarrationProgress(total: number): NarrationProgress {
  return narrationProgress(total, {
    isTty: process.stderr.isTTY === true,
    write: (text) => {
      process.stderr.write(text);
    },
  });
}

export function narrationProgress(
  total: number,
  stream: ProgressStream,
): NarrationProgress {
  let completed = 0;

  function render(): void {
    if (stream.isTty) {
      stream.write(`\r${line(completed, total)}`);
      return;
    }
    stream.write(`${line(completed, total)}\n`);
  }

  render();

  return {
    advance() {
      completed += 1;
      render();
    },
    finish() {
      if (stream.isTty) {
        stream.write('\n');
      }
    },
  };
}

function line(completed: number, total: number): string {
  const ratio = total === 0 ? 1 : completed / total;
  const filled = Math.max(0, Math.min(Math.round(ratio * barWidth), barWidth));
  const bar = `${'█'.repeat(filled)}${'░'.repeat(barWidth - filled)}`;
  return `narration [${bar}] ${completed}/${total}`;
}
