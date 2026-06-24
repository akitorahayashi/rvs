import { describe, expect, test } from 'bun:test';
import { narrationProgress } from '../../src/audio/progress';

describe('narrationProgress', () => {
  test('renders an initial bar and a single updating line on a TTY', () => {
    const writes: string[] = [];
    const progress = narrationProgress(3, {
      isTty: true,
      write: (text) => writes.push(text),
    });

    progress.advance();
    progress.advance();
    progress.advance();
    progress.finish();

    const renders = writes.slice(0, 4);
    expect(renders.every((text) => text.startsWith('\r'))).toBe(true);
    expect(renders[0]).toContain('0/3');
    expect(renders[3]).toContain('3/3');
    expect(writes.at(-1)).toBe('\n');
  });

  test('emits an initial line and one line per step without a TTY', () => {
    const writes: string[] = [];
    const progress = narrationProgress(2, {
      isTty: false,
      write: (text) => writes.push(text),
    });

    progress.advance();
    progress.advance();
    progress.finish();

    expect(writes).toEqual([
      expect.stringMatching(/0\/2\n$/u),
      expect.stringMatching(/1\/2\n$/u),
      expect.stringMatching(/2\/2\n$/u),
    ]);
  });
});
