import { runInNewContext } from "node:vm";
import { expect, test } from "vitest";
import { pcmWorklet } from "./pcm-worklet";

test("microphone frames use clipped signed 16-bit little-endian PCM and never play audio", () => {
  let Processor!: new () => { process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean };
  const frames: ArrayBuffer[] = [];
  runInNewContext(pcmWorklet, {
    AudioWorkletProcessor: class { port = { postMessage: (frame: ArrayBuffer) => frames.push(frame) }; },
    registerProcessor: (_name: string, implementation: typeof Processor) => { Processor = implementation; },
  });
  const processor = new Processor();
  const input = new Float32Array(1024);
  input.set([-2, -1, -0.5, 0, 0.5, 1, 2]);
  const output = new Float32Array(1024);
  expect(processor.process([[input]], [[output]])).toBe(true);
  expect(frames).toHaveLength(1);
  const view = new DataView(frames[0]);
  expect(Array.from({ length: 7 }, (_, index) => view.getInt16(index * 2, true)))
    .toEqual([-32768, -32768, -16384, 0, 16383, 32767, 32767]);
  expect(output.every(sample => sample === 0)).toBe(true);
});
