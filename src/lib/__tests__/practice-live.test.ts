import { describe, it, expect } from "vitest";
import {
  appendTranscript,
  base64ToPcm16,
  buildLiveConnectSetup,
  captureFloatToBase64,
  downsampleFloat32,
  flushLiveConversation,
  INITIAL_LIVE_CONVERSATION,
  liveConstrainedWsUrl,
  liveAuthTokenPayload,
  liveMeterBars,
  liveModelResource,
  liveStageCopy,
  isLivePracticeModel,
  parseLiveAuthTokenResponse,
  parseLiveServerMessage,
  pcm16ToBase64,
  reduceLiveConversation,
  resolveLiveStage,
  rmsLevel,
} from "../practice-live";
import { buildLiveFeedbackPrompt, buildLivePracticePrompt } from "../interview-practice";

describe("isLivePracticeModel", () => {
  it("live モデルだけ真", () => {
    expect(isLivePracticeModel("gemini-3.1-flash-live-preview")).toBe(true);
    expect(isLivePracticeModel("gemini-3.8-flash")).toBe(false);
    expect(isLivePracticeModel(null)).toBe(false);
  });
});

describe("liveModelResource", () => {
  it("models/ を付ける", () => {
    expect(liveModelResource("gemini-3.1-flash-live-preview")).toBe(
      "models/gemini-3.1-flash-live-preview"
    );
    expect(liveModelResource("models/gemini-3.1-flash-live-preview")).toBe(
      "models/gemini-3.1-flash-live-preview"
    );
  });
});

describe("liveConstrainedWsUrl", () => {
  it("access_token をクエリに載せる", () => {
    expect(liveConstrainedWsUrl("tok/abc")).toContain(
      "BidiGenerateContentConstrained?access_token=tok%2Fabc"
    );
  });
});

describe("buildLiveConnectSetup", () => {
  it("音声と文字起こしをロックする", () => {
    const setup = buildLiveConnectSetup("日本語で面談せよ");
    expect(setup.generationConfig.responseModalities).toEqual(["AUDIO"]);
    expect(setup.systemInstruction.parts[0]?.text).toContain("日本語で面談せよ");
    expect(liveAuthTokenPayload(setup).bidiGenerateContentSetup.model).toBe(setup.model);
  });
});

describe("parseLiveAuthTokenResponse", () => {
  it("name だけ通す", () => {
    expect(parseLiveAuthTokenResponse({ name: "auth_tokens/x" })).toEqual({
      name: "auth_tokens/x",
    });
    expect(parseLiveAuthTokenResponse({ name: "" })).toBeNull();
    expect(parseLiveAuthTokenResponse(null)).toBeNull();
  });
});

describe("appendTranscript", () => {
  it("差分もスナップショットもつなぐ", () => {
    expect(appendTranscript("こん", "にちは")).toBe("こんにちは");
    expect(appendTranscript("こんにちは", "こんにちは。")).toBe("こんにちは。");
    expect(appendTranscript("こんにちは", "んにちは")).toBe("こんにちは");
  });
});

describe("parseLiveServerMessage", () => {
  it("音声と転写と turnComplete を同時に出す", () => {
    const events = parseLiveServerMessage({
      serverContent: {
        outputTranscription: { text: "自己紹介を" },
        modelTurn: { parts: [{ inlineData: { data: "abc", mimeType: "audio/pcm" } }] },
        turnComplete: true,
      },
    });
    expect(events.map((e) => e.type)).toEqual(["output", "audio", "turnComplete"]);
  });
});

describe("reduceLiveConversation", () => {
  it("相手役と候補者をターンで確定する", () => {
    const afterOutput = reduceLiveConversation(INITIAL_LIVE_CONVERSATION, [
      { type: "output", text: "自己紹介をお願いします" },
      { type: "turnComplete" },
    ]);
    expect(afterOutput.messages).toEqual([
      { role: "interviewer", content: "自己紹介をお願いします" },
    ]);
    const afterReply = reduceLiveConversation(afterOutput, [
      { type: "input", text: "田中です" },
      { type: "output", text: "経験を教えてください" },
      { type: "turnComplete" },
    ]);
    expect(afterReply.messages.map((m) => m.role)).toEqual([
      "interviewer",
      "candidate",
      "interviewer",
    ]);
  });

  it("割り込みで相手役の途中発話を残す", () => {
    const next = reduceLiveConversation(INITIAL_LIVE_CONVERSATION, [
      { type: "output", text: "まず" },
      { type: "interrupted" },
    ]);
    expect(next.messages).toEqual([{ role: "interviewer", content: "まず" }]);
    expect(next.speaking).toBe(false);
  });
});

describe("flushLiveConversation", () => {
  it("バッファをメッセージにする", () => {
    expect(
      flushLiveConversation({
        ...INITIAL_LIVE_CONVERSATION,
        inputBuf: "はい",
      })
    ).toEqual([{ role: "candidate", content: "はい" }]);
  });
});

describe("pcm helpers", () => {
  it("16bit little-endian を往復する", () => {
    const pcm = new Int16Array([0, -32768, 32767]);
    expect(Array.from(base64ToPcm16(pcm16ToBase64(pcm)))).toEqual(Array.from(pcm));
  });

  it("48k を 16k に間引く", () => {
    const input = new Float32Array(48).map((_, i) => (i % 3 === 0 ? 0.5 : 0));
    expect(downsampleFloat32(input, 48_000, 16_000).length).toBe(16);
  });

  it("キャプチャを base64 PCM にする", () => {
    const encoded = captureFloatToBase64(new Float32Array([0.1, -0.1]), 16_000);
    expect(encoded.length).toBeGreaterThan(0);
    expect(base64ToPcm16(encoded).length).toBe(2);
  });
});

describe("buildLivePracticePrompt", () => {
  it("音声の相手役であることを書く", () => {
    const p = buildLivePracticePrompt({
      project: { title: "案件A", techStack: ["React"], summary: "要約" },
    });
    expect(p).toContain("案件A");
    expect(p).toContain("Gemini Live");
    expect(p).toContain("日本語");
  });
});

describe("buildLiveFeedbackPrompt", () => {
  it("対話を載せる", () => {
    expect(
      buildLiveFeedbackPrompt([{ role: "interviewer", content: "自己紹介を" }])
    ).toContain("面接官: 自己紹介を");
  });
});

describe("rmsLevel", () => {
  it("無音は 0、大きい波は上がる", () => {
    expect(rmsLevel([0, 0, 0, 0])).toBe(0);
    expect(rmsLevel([1, -1, 1, -1])).toBe(1);
    expect(rmsLevel([0.05, -0.05, 0.05, -0.05])).toBeGreaterThan(0);
  });
});

describe("liveMeterBars", () => {
  it("レベルに応じて棒が立つ", () => {
    const low = liveMeterBars(0.1, 4);
    const high = liveMeterBars(1, 4);
    expect(low[0]).toBeGreaterThan(0.12);
    expect(high.every((bar) => bar === 1)).toBe(true);
  });
});

describe("resolveLiveStage", () => {
  it("相手役・自分・番を切り替える", () => {
    expect(
      resolveLiveStage({
        preview: true,
        connected: false,
        partnerSpeaking: false,
        userLevel: 0,
      })
    ).toBe("idle");
    expect(liveStageCopy("idle").title).toBe("相手役");
    expect(
      resolveLiveStage({
        connected: false,
        partnerSpeaking: false,
        userLevel: 0,
      })
    ).toBe("connecting");
    expect(
      resolveLiveStage({
        connected: true,
        partnerSpeaking: true,
        userLevel: 0,
      })
    ).toBe("partner");
    expect(
      resolveLiveStage({
        connected: true,
        partnerSpeaking: false,
        userLevel: 0.5,
      })
    ).toBe("user");
    expect(
      resolveLiveStage({
        connected: true,
        partnerSpeaking: false,
        userLevel: 0,
      })
    ).toBe("your_turn");
    expect(
      resolveLiveStage({
        connected: true,
        partnerSpeaking: true,
        userLevel: 0.5,
      })
    ).toBe("barge_in");
    expect(liveStageCopy("your_turn").title).toBe("あなたの番です");
    expect(liveStageCopy("user").title).toBe("入力中");
  });
});

