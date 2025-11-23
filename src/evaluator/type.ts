import type { TypingWordState, WordChunk } from "../type";

export interface TypingKey {
  keys: string[];
  key: string;
  code: string;
  shift?: boolean;
}

export interface TypingEvaluationResult {
  nextWordState: TypingWordState;
  successKey: string | undefined;
  failKey: string | undefined;
  charType: WordChunk["type"];
  isCompleted: boolean;
  updatePoint: number;
}
