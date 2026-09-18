/** Cheap JSON tasks (案件整理・一括準備など). */
export const GEMINI_MODEL_ID = "gemini-3.5-flash-lite";

/** Grounded research and interview practice counterpart. */
export const GEMINI_RESEARCH_MODEL_ID = "gemini-3.8-flash";

/** Gemini Live API (realtime audio interview practice). */
export const GEMINI_LIVE_MODEL_ID = "gemini-3.8-live";

export const GEMINI_JSON_PROVIDER_OPTIONS = {
  google: {
    thinkingConfig: { thinkingLevel: "low" as const },
  },
};
