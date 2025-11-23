import type { TypingWord, WordChunk } from "../type";

export interface TypingKey {
  keys: string[];
  key: string;
  code: string;
  shift?: boolean;
}

export interface TypingEvaluationResult {
  nextTypingWord: TypingWord;
  successKey: string | undefined;
  failKey: string | undefined;
  chunkType: WordChunk["type"];
  isCompleted: boolean;
  updatePoint: number;
}
