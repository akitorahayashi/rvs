import { describe, expect, test } from 'bun:test';
import path from 'node:path';

interface CommandResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

function runCli(args: string[]): CommandResult {
  const command = Bun.spawnSync(['bun', 'src/rvs/main.ts', ...args], {
    cwd: path.join(import.meta.dir, '..', '..'),
    stderr: 'pipe',
    stdout: 'pipe',
  });

  return {
    exitCode: command.exitCode ?? 1,
    stderr: command.stderr.toString().trim(),
    stdout: command.stdout.toString().trim(),
  };
}

describe('render command', () => {
  test('prints help when no command is provided', () => {
    const result = runCli([]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('render <project>');
  });

  test('prints the package version', () => {
    const result = runCli(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('rvs 0.1.0');
  });

  test('fails when a required project is missing', () => {
    const result = runCli(['render']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('missing required args');
    expect(result.stdout).toContain('Usage:');
  });

  test('fails for unexpected positional arguments', () => {
    const result = runCli(['render', 'demo', 'extra']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Unexpected positional arguments: extra.');
    expect(result.stdout).toContain('Usage:');
  });

  test('rejects project references outside projects', () => {
    const result = runCli(['render', '../demo']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('safe project ID');
    expect(result.stdout).toBe('');
  });
});
