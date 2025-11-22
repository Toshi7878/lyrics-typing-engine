import type { LineWord, TypeChunk } from "../type";

export interface TypingKey {
  keys: string[];
  key: string;
  code: string;
  shift?: boolean;
}

export interface TypingEvaluationResult {
  newLineWord: LineWord;
  successKey: string | undefined;
  failKey: string | undefined;
  charType: TypeChunk["type"];
  isCompleted: boolean;
  updatePoint: number;
}
