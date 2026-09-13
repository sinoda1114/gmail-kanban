import { GEMINI_LIVE_MODEL_ID } from "@/lib/ai-model";
import { clipPracticeTranscript } from "@/lib/practice-speech";
import {
  MAX_PRACTICE_MESSAGE_CHARS,
  type PracticeMessage,
} from "@/types/interview-practice";

export const LIVE_INPUT_SAMPLE_RATE = 16_000;
export const LIVE_OUTPUT_SAMPLE_RATE = 24_000;
export const LIVE_PCM_MIME = "audio/pcm;rate=16000";
export const LIVE_PRACTICE_VOICE = "Kore";
export const LIVE_KICKOFF_TEXT =
  "日本語で面談を始めてください。最初の質問を話してください。";
export const LIVE_WS_PATH =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained";

export type LiveConnectSetup = {
  model: string;
  generationConfig: {
    responseModalities: ["AUDIO"];
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: string } };
    };
  };
  systemInstruction: { parts: Array<{ text: string }> };
  inputAudioTranscription: Record<string, never>;
  outputAudioTranscription: Record<string, never>;
  sessionResumption: Record<string, never>;
};

export function isLivePracticeModel(model: string | null | undefined): boolean {
  return Boolean(model && model.includes("live"));
}

export function liveModelResource(modelId = GEMINI_LIVE_MODEL_ID): string {
  return modelId.startsWith("models/") ? modelId : `models/${modelId}`;
}

export function buildLiveConnectSetup(systemInstruction: string): LiveConnectSetup {
  return {
    model: liveModelResource(),
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: LIVE_PRACTICE_VOICE } },
      },
    },
    systemInstruction: { parts: [{ text: systemInstruction }] },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    sessionResumption: {},
  };
}

export function liveConstrainedWsUrl(token: string): string {
  return `${LIVE_WS_PATH}?access_token=${encodeURIComponent(token)}`;
}

export function appendTranscript(buffer: string, incoming: string): string {
  const next = incoming.trim() ? incoming : "";
  if (!next) return buffer;
  if (!buffer) return next;
  if (next.startsWith(buffer)) return next;
  if (buffer.endsWith(next)) return buffer;
  return `${buffer}${next}`;
}

export type LiveServerEvent =
  | { type: "setupComplete" }
  | { type: "input"; text: string }
  | { type: "output"; text: string }
  | { type: "audio"; data: string }
  | { type: "interrupted" }
  | { type: "turnComplete" }
  | { type: "goAway" };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function transcriptionText(value: unknown): string {
  const rec = asRecord(value);
  return typeof rec?.text === "string" ? rec.text : "";
}

export function parseLiveServerMessage(raw: unknown): LiveServerEvent[] {
  const message = asRecord(raw);
  if (!message) return [];
  const events: LiveServerEvent[] = [];
  if (message.setupComplete) events.push({ type: "setupComplete" });
  const serverContent = asRecord(message.serverContent);
  if (serverContent) {
    const input = transcriptionText(serverContent.inputTranscription);
    if (input) events.push({ type: "input", text: input });
    const output = transcriptionText(serverContent.outputTranscription);
    if (output) events.push({ type: "output", text: output });
    const modelTurn = asRecord(serverContent.modelTurn);
    const parts = Array.isArray(modelTurn?.parts) ? modelTurn.parts : [];
    for (const part of parts) {
      const inline = asRecord(asRecord(part)?.inlineData);
      if (typeof inline?.data === "string" && inline.data) {
        events.push({ type: "audio", data: inline.data });
      }
    }
    if (serverContent.interrupted) events.push({ type: "interrupted" });
    if (serverContent.turnComplete) events.push({ type: "turnComplete" });
  }
  if (message.goAway) events.push({ type: "goAway" });
  return events;
}

export type LiveConversationState = {
  inputBuf: string;
  outputBuf: string;
  messages: PracticeMessage[];
  speaking: boolean;
};

export const INITIAL_LIVE_CONVERSATION: LiveConversationState = {
  inputBuf: "",
  outputBuf: "",
  messages: [],
  speaking: false,
};

function clipMessage(content: string): string {
  return clipPracticeTranscript(content.trim(), MAX_PRACTICE_MESSAGE_CHARS);
}

function pushMessage(
  messages: PracticeMessage[],
  role: PracticeMessage["role"],
  content: string
): PracticeMessage[] {
  const clipped = clipMessage(content);
  if (!clipped) return messages;
  return [...messages, { role, content: clipped }];
}

export function reduceLiveConversation(
  state: LiveConversationState,
  events: LiveServerEvent[]
): LiveConversationState {
  let next = state;
  for (const event of events) {
    if (event.type === "input") {
      let messages = next.messages;
      let outputBuf = next.outputBuf;
      if (outputBuf.trim()) {
        messages = pushMessage(messages, "interviewer", outputBuf);
        outputBuf = "";
      }
      next = {
        ...next,
        messages,
        outputBuf,
        inputBuf: appendTranscript(next.inputBuf, event.text),
        speaking: false,
      };
    } else if (event.type === "output") {
      let messages = next.messages;
      let inputBuf = next.inputBuf;
      if (inputBuf.trim()) {
        messages = pushMessage(messages, "candidate", inputBuf);
        inputBuf = "";
      }
      next = {
        ...next,
        messages,
        inputBuf,
        outputBuf: appendTranscript(next.outputBuf, event.text),
        speaking: true,
      };
    } else if (event.type === "interrupted") {
      let messages = next.messages;
      let outputBuf = next.outputBuf;
      if (outputBuf.trim()) {
        messages = pushMessage(messages, "interviewer", outputBuf);
        outputBuf = "";
      }
      next = { ...next, messages, outputBuf, speaking: false };
    } else if (event.type === "turnComplete") {
      let messages = next.messages;
      let inputBuf = next.inputBuf;
      let outputBuf = next.outputBuf;
      if (inputBuf.trim()) {
        messages = pushMessage(messages, "candidate", inputBuf);
        inputBuf = "";
      }
      if (outputBuf.trim()) {
        messages = pushMessage(messages, "interviewer", outputBuf);
        outputBuf = "";
      }
      next = { ...next, messages, inputBuf, outputBuf, speaking: false };
    }
  }
  return next;
}

export function flushLiveConversation(
  state: LiveConversationState
): PracticeMessage[] {
  return reduceLiveConversation(state, [{ type: "turnComplete" }]).messages;
}

export function downsampleFloat32(
  input: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number
): Float32Array {
  if (inputSampleRate === outputSampleRate) return input;
  if (inputSampleRate <= 0 || outputSampleRate <= 0 || input.length === 0) {
    return new Float32Array(0);
  }
  const ratio = inputSampleRate / outputSampleRate;
  const outLength = Math.max(1, Math.floor(input.length / ratio));
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const idx = i * ratio;
    const i0 = Math.floor(idx);
    const frac = idx - i0;
    const s0 = input[i0] ?? 0;
    const s1 = input[i0 + 1] ?? s0;
    output[i] = s0 + (s1 - s0) * frac;
  }
  return output;
}

export function float32ToPcm16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i] ?? 0));
    out[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
  }
  return out;
}

export function pcm16ToBytes(pcm: Int16Array): Uint8Array {
  const bytes = new Uint8Array(pcm.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < pcm.length; i++) {
    view.setInt16(i * 2, pcm[i] ?? 0, true);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function pcm16ToBase64(pcm: Int16Array): string {
  return bytesToBase64(pcm16ToBytes(pcm));
}

export function base64ToBytes(data: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(data, "base64"));
  }
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function base64ToPcm16(data: string): Int16Array {
  const bytes = base64ToBytes(data);
  const count = Math.floor(bytes.length / 2);
  const pcm = new Int16Array(count);
  const view = new DataView(bytes.buffer, bytes.byteOffset, count * 2);
  for (let i = 0; i < count; i++) {
    pcm[i] = view.getInt16(i * 2, true);
  }
  return pcm;
}

export function captureFloatToBase64(
  input: Float32Array,
  inputSampleRate: number
): string {
  const down = downsampleFloat32(input, inputSampleRate, LIVE_INPUT_SAMPLE_RATE);
  return pcm16ToBase64(float32ToPcm16(down));
}

export type LiveAuthTokenResponse = {
  name: string;
};

export function parseLiveAuthTokenResponse(raw: unknown): LiveAuthTokenResponse | null {
  const rec = asRecord(raw);
  if (typeof rec?.name !== "string" || !rec.name.trim()) return null;
  return { name: rec.name };
}

export function liveAuthTokenPayload(setup: LiveConnectSetup) {
  return {
    uses: 2,
    bidiGenerateContentSetup: setup,
  };
}

export const LIVE_USER_LEVEL_THRESHOLD = 0.08;

export function rmsLevel(samples: ArrayLike<number>): number {
  const n = samples.length;
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = samples[i] ?? 0;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / n) * 4);
}

export function liveMeterBars(level: number, count = 12): number[] {
  const clamped = Math.max(0, Math.min(1, level));
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = i / count;
    const end = (i + 1) / count;
    if (clamped >= end) bars.push(1);
    else if (clamped <= start) bars.push(0.12);
    else bars.push(0.12 + 0.88 * ((clamped - start) / (1 / count)));
  }
  return bars;
}

export const LIVE_STAGE_IDS = [
  "idle",
  "connecting",
  "partner",
  "your_turn",
  "user",
  "barge_in",
] as const;
export type LiveStageId = (typeof LIVE_STAGE_IDS)[number];

export function resolveLiveStage(input: {
  preview?: boolean;
  connected: boolean;
  partnerSpeaking: boolean;
  userLevel: number;
}): LiveStageId {
  if (input.preview) return "idle";
  if (!input.connected) return "connecting";
  const user = input.userLevel >= LIVE_USER_LEVEL_THRESHOLD;
  if (input.partnerSpeaking && user) return "barge_in";
  if (input.partnerSpeaking) return "partner";
  if (user) return "user";
  return "your_turn";
}

export function liveStageCopy(stage: LiveStageId): { title: string; hint: string } {
  switch (stage) {
    case "idle":
      return {
        title: "相手役",
        hint: "開始すると、話す番と音声入力がここで分かります。",
      };
    case "connecting":
      return {
        title: "接続中",
        hint: "マイクの許可を出すと面談が始まります。",
      };
    case "partner":
      return {
        title: "相手役が話しています",
        hint: "今は聞く番です。途中で割り込むこともできます。",
      };
    case "your_turn":
      return {
        title: "あなたの番です",
        hint: "どうぞ話してください。",
      };
    case "user":
      return {
        title: "入力中",
        hint: "声が乗っています。",
      };
    case "barge_in":
      return {
        title: "入力中（割り込み）",
        hint: "相手役の話に声を被せています。",
      };
  }
}

