import type { BuiltMapLine, TypingWordState } from "../type";

export const createWordState = <TOptions = unknown>(mapLine: BuiltMapLine<TOptions>): TypingWordState => {
  if (mapLine.wordChunks.length === 0) {
    return {
      correct: { kana: "", roma: "" },
      nextChunk: {
        kana: "",
        romaPatterns: [],
        point: 0,
        type: undefined,
      },
      wordChunks: [],
    };
  }

  return {
    correct: { kana: "", roma: "" },
    nextChunk: { ...mapLine.wordChunks[0], romaPatterns: [...mapLine.wordChunks[0].romaPatterns] },
    wordChunks: mapLine.wordChunks.slice(1).map((chunk) => ({
      ...chunk,
      romaPatterns: [...chunk.romaPatterns],
    })),
  };
};
