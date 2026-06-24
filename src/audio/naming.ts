export function narrationAudioFileName(index: number, name: string): string {
  return `${String(index + 1).padStart(2, '0')}_${name}.mp3`;
}
