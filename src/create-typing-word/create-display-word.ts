import type { TypingWord } from "../type";

export const createDisplayWord = (
  typingWord: TypingWord,
  options?: {
    remainWord?: { maxLength: number };
  },
) => {
  const correct = {
    kana: replaceAllSpaceWithLowMacron(typingWord.correct.kana),
    roma: replaceAllSpaceWithLowMacron(typingWord.correct.roma),
  };

  const nextChar = {
    kana: replaceAllSpaceWithThreePerEmSpace(typingWord.nextChunk.kana),
    roma: replaceAllSpaceWithThreePerEmSpace(typingWord.nextChunk.romaPatterns[0] ?? ""),
  };

  const remainKana = typingWord.wordChunks.map((chunk) => chunk.kana).join("");
  const remainRoma = typingWord.wordChunks.map((chunk) => chunk.romaPatterns[0]).join("");

  const maxLength = options?.remainWord?.maxLength;

  const remainWord = {
    kana: replaceAllSpaceWithThreePerEmSpace(maxLength ? remainKana.slice(0, maxLength) : remainKana),
    roma: replaceAllSpaceWithThreePerEmSpace(maxLength ? remainRoma.slice(0, maxLength) : remainRoma),
  };

  return { correct, nextChar, remainWord };
};

const replaceAllSpaceWithThreePerEmSpace = (text: string) => {
  return text.replaceAll(" ", " ");
};

const replaceAllSpaceWithLowMacron = (text: string) => {
  return text.replaceAll(" ", "ˍ");
};
