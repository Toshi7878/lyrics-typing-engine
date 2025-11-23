import type { InputMode, TypingWordState } from "../type";
import { kanaInput, kanaMakeInput } from "./kana-input";
import { romaInput, romaMakeInput } from "./roma-input";
import type { TypingEvaluationResult, TypingKey } from "./type";

export const evaluateRomaInput = (
  event: Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "keyCode">,
  wordState: TypingWordState,
): TypingEvaluationResult => {
  const typingKey = romaMakeInput(event);
  const { newLineWord, successKey, failKey, isUpdatePoint } = romaInput(typingKey, { ...wordState });

  return {
    nextWordState: newLineWord,
    successKey,
    failKey,
    charType: wordState.nextChunk.type,
    isCompleted: newLineWord.nextChunk.kana === "",
    updatePoint: isUpdatePoint ? wordState.nextChunk.point : 0,
  };
};

export const evaluateKanaInput = (
  event: Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "keyCode">,
  wordState: TypingWordState,
): TypingEvaluationResult => {
  const typingKey = kanaMakeInput(event);
  const { newLineWord, successKey, failKey, isUpdatePoint } = kanaInput(typingKey, { ...wordState });

  return {
    nextWordState: newLineWord,
    successKey,
    failKey,
    charType: wordState.nextChunk.type,
    isCompleted: newLineWord.nextChunk.kana === "",
    updatePoint: isUpdatePoint ? wordState.nextChunk.point : 0,
  };
};

export const evaluateTypingInput = (
  typingKeys: TypingKey,
  inputMode: InputMode,
  wordState: TypingWordState,
): TypingEvaluationResult => {
  const { newLineWord, successKey, failKey, isUpdatePoint } =
    inputMode === "roma" ? romaInput(typingKeys, { ...wordState }) : kanaInput(typingKeys, { ...wordState });

  return {
    nextWordState: newLineWord,
    successKey,
    failKey,
    charType: wordState.nextChunk.type,
    isCompleted: newLineWord.nextChunk.kana === "",
    updatePoint: isUpdatePoint ? wordState.nextChunk.point : 0,
  };
};

// const yoonFlickList = ["ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "ゃ", "ゅ", "ょ", "っ", "ゎ"];
// const yoonFlickListLarge = ["あ", "い", "う", "え", "お", "や", "ゆ", "よ", "つ", "わ"];
// const smallKanaList = ["っ", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "ゃ", "ゅ", "ょ", "ゎ", "ヵ", "ヶ", "ん"];
// const OptimisationWhiteList = ["っっ", "っん", "っい", "っう"];

// const kana_mode_convert_rule_before = ["←", "↓", "↑", "→", "『", "』"];
// const kana_mode_convert_rule_after = ["ひだり", "した", "うえ", "みぎ", "「", "」"];
