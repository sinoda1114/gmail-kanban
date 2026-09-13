import {
  LIVE_OUTPUT_SAMPLE_RATE,
  base64ToPcm16,
  captureFloatToBase64,
} from "@/lib/practice-live";

const CAPTURE_WORKLET = `
class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel && channel.length) {
      this.port.postMessage(Float32Array.from(channel));
    }
    return true;
  }
}
registerProcessor("pcm-capture", PcmCaptureProcessor);
`;

function audioContextCtor(): typeof AudioContext {
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext || w.webkitAudioContext!;
}

export class PracticeLiveAudio {
  private captureCtx: AudioContext | null = null;
  private playbackCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextPlayTime = 0;
  private sources: AudioBufferSourceNode[] = [];
  private queuedPlayback: string[] = [];

  async start(onChunk: (base64: string) => void): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        channelCount: 1,
      },
    });
    const Ctor = audioContextCtor();
    this.captureCtx = new Ctor();
    this.playbackCtx = new Ctor({ sampleRate: LIVE_OUTPUT_SAMPLE_RATE });
    await this.captureCtx.resume();
    await this.playbackCtx.resume();
    this.flushQueuedPlayback();

    const source = this.captureCtx.createMediaStreamSource(this.stream);
    const mute = this.captureCtx.createGain();
    mute.gain.value = 0;
    mute.connect(this.captureCtx.destination);
    const inputRate = this.captureCtx.sampleRate;
    try {
      const blob = new Blob([CAPTURE_WORKLET], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      await this.captureCtx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      this.workletNode = new AudioWorkletNode(this.captureCtx, "pcm-capture");
      this.workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (event.data?.length) {
          onChunk(captureFloatToBase64(event.data, inputRate));
        }
      };
      source.connect(this.workletNode);
      this.workletNode.connect(mute);
    } catch {
      this.processor = this.captureCtx.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = (event) => {
        const channel = event.inputBuffer.getChannelData(0);
        onChunk(captureFloatToBase64(channel, inputRate));
      };
      source.connect(this.processor);
      this.processor.connect(mute);
    }
  }

  playPcmBase64(data: string): void {
    if (!this.playbackCtx) {
      this.queuedPlayback.push(data);
      return;
    }
    this.flushQueuedPlayback();
    this.enqueuePlayback(data);
  }

  private flushQueuedPlayback(): void {
    if (!this.playbackCtx || this.queuedPlayback.length === 0) return;
    const queued = this.queuedPlayback;
    this.queuedPlayback = [];
    for (const data of queued) this.enqueuePlayback(data);
  }

  private enqueuePlayback(data: string): void {
    if (!this.playbackCtx) return;
    const pcm = base64ToPcm16(data);
    if (pcm.length === 0) return;
    const f32 = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) {
      f32[i] = (pcm[i] ?? 0) / 32768;
    }
    const buffer = this.playbackCtx.createBuffer(
      1,
      f32.length,
      LIVE_OUTPUT_SAMPLE_RATE
    );
    buffer.copyToChannel(f32, 0);
    const src = this.playbackCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.playbackCtx.destination);
    const now = this.playbackCtx.currentTime;
    if (this.nextPlayTime < now) this.nextPlayTime = now;
    src.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;
    this.sources.push(src);
    src.onended = () => {
      this.sources = this.sources.filter((item) => item !== src);
    };
  }

  interruptPlayback(): void {
    for (const src of this.sources) {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources = [];
    if (this.playbackCtx) this.nextPlayTime = this.playbackCtx.currentTime;
  }

  stop(): void {
    this.interruptPlayback();
    this.queuedPlayback = [];
    this.workletNode?.disconnect();
    this.processor?.disconnect();
    this.workletNode = null;
    this.processor = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    void this.captureCtx?.close();
    void this.playbackCtx?.close();
    this.captureCtx = null;
    this.playbackCtx = null;
  }
}

export function canUsePracticeLive(): boolean {
  if (typeof window === "undefined") return false;
  const Ctor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return Boolean(navigator.mediaDevices?.getUserMedia) && Boolean(Ctor);
}
