import type { InputMode, TypingWord, WordChunk } from "../type.js";
import { evaluateKanaInput, evaluateRomaInput } from "./typing-input-evaluator.js";

export const handleTyping = <TSuccessReturn extends Record<string, unknown>>(
  {
    event,
    inputMode,
    typingWord,
    isCaseSensitive,
  }: {
    event: KeyboardEvent;
    inputMode: InputMode;
    typingWord: TypingWord;
    isCaseSensitive?: boolean;
  },
  {
    onSuccess,
    onCompleted,
    onMiss,
  }: {
    onSuccess: (result: {
      nextTypingWord: TypingWord;
      successKey: string;
      isCompleted: boolean;
      updatePoint: number;
      chunkType: WordChunk["type"];
    }) => TSuccessReturn;
    onCompleted: (result: TSuccessReturn) => void;
    onMiss: (result: { failKey: string }) => void;
  },
) => {
  const result =
    inputMode === "roma"
      ? evaluateRomaInput({ event, typingWord, isCaseSensitive })
      : evaluateKanaInput({ event, typingWord, isCaseSensitive });

  if (result.successKey) {
    const { nextTypingWord, successKey, isCompleted, updatePoint, chunkType } = result;

    const successReturn = onSuccess({
      nextTypingWord,
      successKey,
      isCompleted,
      updatePoint,
      chunkType,
    });

    if (isCompleted) {
      onCompleted(successReturn);
    }
  } else if (result.failKey) {
    onMiss({ failKey: result.failKey });
  }
};
