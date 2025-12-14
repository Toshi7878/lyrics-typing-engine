import { parseWordToChunks } from "../build-typing-map/parse-word-to-chunks";
import type { TypingWord, WordChunk } from "../type";
import { createTypingWord } from "./create-typing-word";

export const recreateTypingWord = (typingWord: TypingWord): TypingWord => {
  if (!typingWord.nextChunk.kana || !typingWord.wordChunks[0]) {
    return typingWord;
  }

  const remainingWordChunks = typingWord.wordChunks.slice(typingWord.wordChunksIndex);

  const reconstructedWord =
    (typingWord.nextChunk.originalDakutenChar ?? typingWord.nextChunk.kana) +
    remainingWordChunks.map((chunk) => chunk.kana).join("");

  const charPoint = calculateCharPoint(typingWord.wordChunks[0]);
  const wordChunks = parseWordToChunks({ word: reconstructedWord, charPoint });
  const newTypingWord = createTypingWord({ wordChunks }, typingWord.correct);

  if (newTypingWord.nextChunk) {
    newTypingWord.nextChunk.point = typingWord.nextChunk.point;
  }

  return newTypingWord;
};

const calculateCharPoint = (targetChunk: WordChunk): number => {
  const romaLength = targetChunk.romaPatterns[0]?.length ?? 1;
  return Math.floor((targetChunk.point / romaLength) * 100) / 100;
};
