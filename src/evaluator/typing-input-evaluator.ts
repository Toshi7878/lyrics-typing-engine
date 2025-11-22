import type { InputMode, LineWord } from "../type";
import { kanaInput, kanaMakeInput } from "./kana-input";
import { romaInput, romaMakeInput } from "./roma-input";
import type { TypingEvaluationResult, TypingKey } from "./type";

export const evaluateRomaTypingInput = (
  event: Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "keyCode">,
  lineWord: LineWord,
): TypingEvaluationResult => {
  const typingKey = romaMakeInput(event);
  const { newLineWord, successKey, failKey, isUpdatePoint } = romaInput(typingKey, lineWord);

  return {
    newLineWord,
    successKey,
    failKey,
    charType: lineWord.nextChunk.type,
    isCompleted: newLineWord.nextChunk.kana === "",
    updatePoint: isUpdatePoint ? lineWord.nextChunk.point : 0,
  };
};

export const evaluateKanaTypingInput = (
  event: Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "keyCode">,
  lineWord: LineWord,
): TypingEvaluationResult => {
  const typingKey = kanaMakeInput(event);
  const { newLineWord, successKey, failKey, isUpdatePoint } = kanaInput(typingKey, lineWord);

  return {
    newLineWord,
    successKey,
    failKey,
    charType: lineWord.nextChunk.type,
    isCompleted: newLineWord.nextChunk.kana === "",
    updatePoint: isUpdatePoint ? lineWord.nextChunk.point : 0,
  };
};

export const evaluateTypingInput = (
  typingKeys: TypingKey,
  inputMode: InputMode,
  lineWord: LineWord,
): TypingEvaluationResult => {
  const { newLineWord, successKey, failKey, isUpdatePoint } =
    inputMode === "roma" ? romaInput(typingKeys, lineWord) : kanaInput(typingKeys, lineWord);

  return {
    newLineWord,
    successKey,
    failKey,
    charType: lineWord.nextChunk.type,
    isCompleted: newLineWord.nextChunk.kana === "",
    updatePoint: isUpdatePoint ? lineWord.nextChunk.point : 0,
  };
};

// const yoonFlickList = ["ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "ゃ", "ゅ", "ょ", "っ", "ゎ"];
// const yoonFlickListLarge = ["あ", "い", "う", "え", "お", "や", "ゆ", "よ", "つ", "わ"];
// const smallKanaList = ["っ", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "ゃ", "ゅ", "ょ", "ゎ", "ヵ", "ヶ", "ん"];
// const OptimisationWhiteList = ["っっ", "っん", "っい", "っう"];

// const kana_mode_convert_rule_before = ["←", "↓", "↑", "→", "『", "』"];
// const kana_mode_convert_rule_after = ["ひだり", "した", "うえ", "みぎ", "「", "」"];
