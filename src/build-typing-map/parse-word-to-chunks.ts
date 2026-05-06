import type { WordChunk } from "../type.js";
import { parseKanaChunks } from "./parse-kana-chunks.js";
import { parseKanaChunksToWordChunks } from "./parse-kana-chunks-to-word-chunks.js";

export const parseWordToChunks = ({ word, charPoint }: { word: string; charPoint: number }): WordChunk[] => {
  const kanaChunks = parseKanaChunks(word)[0] || [];
  return parseKanaChunksToWordChunks({ kanaChunks, charPoint });
};
