import { describe, expect, test } from 'bun:test';
import { narrationProgress } from '../../src/rvs/audio/progress';

describe('narrationProgress', () => {
  test('renders a single updating line with completed count on a TTY', () => {
    const writes: string[] = [];
    const progress = narrationProgress(3, {
      isTty: true,
      write: (text) => writes.push(text),
    });

    progress.advance();
    progress.advance();
    progress.advance();
    progress.finish();

    const renders = writes.slice(0, 3);
    expect(renders.every((text) => text.startsWith('\r'))).toBe(true);
    expect(renders[0]).toContain('1/3');
    expect(renders[2]).toContain('3/3');
    expect(writes.at(-1)).toBe('\n');
  });

  test('emits one newline-terminated line per step without a TTY', () => {
    const writes: string[] = [];
    const progress = narrationProgress(2, {
      isTty: false,
      write: (text) => writes.push(text),
    });

    progress.advance();
    progress.advance();
    progress.finish();

    expect(writes).toEqual([
      expect.stringMatching(/1\/2\n$/u),
      expect.stringMatching(/2\/2\n$/u),
    ]);
  });
});
