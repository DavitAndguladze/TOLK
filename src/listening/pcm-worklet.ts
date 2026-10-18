/** Runs in AudioWorkletGlobalScope; streams 64 ms of mono, signed 16-bit LE PCM. */
export const pcmWorklet = `
class ReadingPcm extends AudioWorkletProcessor {
  constructor() { super(); this.buffer = new ArrayBuffer(2048); this.view = new DataView(this.buffer); this.offset = 0; }
  process(inputs) {
    const samples = inputs[0]?.[0];
    if (!samples) return true;
    for (const sample of samples) {
      const clipped = Math.max(-1, Math.min(1, sample));
      this.view.setInt16(this.offset, clipped * (clipped < 0 ? 32768 : 32767), true);
      this.offset += 2;
      if (this.offset === 2048) {
        this.port.postMessage(this.buffer, [this.buffer]);
        this.buffer = new ArrayBuffer(2048); this.view = new DataView(this.buffer); this.offset = 0;
      }
    }
    return true;
  }
}
registerProcessor("reading-pcm", ReadingPcm);
`;
