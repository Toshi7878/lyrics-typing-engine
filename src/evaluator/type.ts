import type { TypingWord, WordChunk } from "../type";

export interface TypingInput {
  inputChars: string[];
  key: string;
  code: string;
  shift?: boolean;
}

export interface TypingInputResult {
  nextTypingWord: TypingWord;
  successKey: string | undefined;
  failKey: string | undefined;
  chunkType: WordChunk["type"];
  isCompleted: boolean;
  updatePoint: number;
}
