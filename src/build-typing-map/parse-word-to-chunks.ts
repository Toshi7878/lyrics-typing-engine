import type { WordChunk } from "../type";
import { parseKanaChunks } from "./parse-kana-chunks";
import { parseKanaChunksToWordChunks } from "./parse-kana-chunks-to-word-chunks";

export const parseWordToChunks = ({ word, charPoint }: { word: string; charPoint: number }): WordChunk[] => {
  const kanaChunks = parseKanaChunks(word)[0] || [];

  return parseKanaChunksToWordChunks({ kanaChunks, charPoint });
};
