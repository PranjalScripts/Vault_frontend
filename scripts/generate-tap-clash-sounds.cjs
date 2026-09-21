// Original short synthesized cues. No sampled or third-party audio.
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, '../assets/sounds/tap-clash');
fs.mkdirSync(output, { recursive: true });
const rate = 22050;
const cues = {
  countdown: { length: .12, notes: [520] }, tap: { length: .035, notes: [180] },
  pressure: { length: .14, notes: [260, 330] }, victory: { length: .48, notes: [440, 554.37, 659.25, 880] },
  complete: { length: .36, notes: [440, 392, 330] },
};
for (const [name, cue] of Object.entries(cues)) {
  const count = Math.floor(rate * cue.length), buffer = Buffer.alloc(44 + count * 2);
  buffer.write('RIFF'); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) {
    const t = i / rate, noteLength = cue.length / cue.notes.length;
    const phase = (t % noteLength) / noteLength;
    const frequency = cue.notes[Math.min(cue.notes.length - 1, Math.floor(t / noteLength))];
    const envelope = Math.min(1, phase * 20) * Math.pow(1 - phase, 2);
    const wave = Math.sin(2 * Math.PI * frequency * t) + .15 * Math.sin(4 * Math.PI * frequency * t);
    buffer.writeInt16LE(Math.round(wave * envelope * 6500), 44 + i * 2);
  }
  fs.writeFileSync(path.join(output, `${name}.wav`), buffer);
}
