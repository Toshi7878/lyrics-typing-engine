import type { BuiltMapLine, TypingWord } from "../type";

export const createTypingWord = <TOptions = unknown>(builtMapLine: BuiltMapLine<TOptions>): TypingWord => {
  if (builtMapLine.wordChunks.length === 0) {
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
    nextChunk: { ...builtMapLine.wordChunks[0], romaPatterns: [...builtMapLine.wordChunks[0].romaPatterns] },
    wordChunks: builtMapLine.wordChunks.slice(1).map((chunk) => ({
      ...chunk,
      romaPatterns: [...chunk.romaPatterns],
    })),
  };
};
