import type { BuiltMapLine, TypingWord } from "../type";

export const createTypingWord = <TOptions = unknown>(
  builtMapLine: Pick<BuiltMapLine<TOptions>, "wordChunks">,
  correct?: TypingWord["correct"],
  wordChunksIndex?: number,
): TypingWord => {
  if (!builtMapLine.wordChunks[0]) {
    return {
      correct: correct ? { ...correct } : { kana: "", roma: "" },
      nextChunk: {
        kana: "",
        romaPatterns: [],
        point: 0,
        type: undefined,
      },
      wordChunks: [],
      wordChunksIndex: 0,
    };
  }

  return {
    correct: correct ? { ...correct } : { kana: "", roma: "" },
    nextChunk: { ...builtMapLine.wordChunks[0], romaPatterns: [...builtMapLine.wordChunks[0].romaPatterns] },
    wordChunks: builtMapLine.wordChunks.map((chunk) => ({
      ...chunk,
      romaPatterns: [...chunk.romaPatterns],
    })),
    wordChunksIndex: wordChunksIndex ?? 1,
  };
};
