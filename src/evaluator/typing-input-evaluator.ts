import type { InputMode, TypingWord } from "../type";
import { kanaInput, kanaMakeInput } from "./kana-input";
import { romaInput, romaMakeInput } from "./roma-input";
import type { TypingInput, TypingInputResult } from "./type";

export const evaluateRomaInput = (
  event: Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "keyCode">,
  typingWord: TypingWord,
): TypingInputResult => {
  const typingInput = romaMakeInput(event);
  const { newLineWord, successKey, failKey, isUpdatePoint } = romaInput(typingInput, { ...typingWord });

  return {
    nextTypingWord: newLineWord,
    successKey,
    failKey,
    chunkType: typingWord.nextChunk.type,
    isCompleted: newLineWord.nextChunk.kana === "",
    updatePoint: isUpdatePoint ? typingWord.nextChunk.point : 0,
  };
};

export const evaluateKanaInput = (
  event: Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "keyCode">,
  typingWord: TypingWord,
): TypingInputResult => {
  const typingInput = kanaMakeInput(event);
  const { newLineWord, successKey, failKey, isUpdatePoint } = kanaInput(typingInput, { ...typingWord });

  return {
    nextTypingWord: newLineWord,
    successKey,
    failKey,
    chunkType: typingWord.nextChunk.type,
    isCompleted: newLineWord.nextChunk.kana === "",
    updatePoint: isUpdatePoint ? typingWord.nextChunk.point : 0,
  };
};

export const executeTypingInput = (
  inputChar: string,
  inputMode: InputMode,
  typingWord: TypingWord,
): TypingInputResult => {
  const typingInput: TypingInput = {
    inputChars: [inputChar],
    key: inputChar,
    code: `Key${inputChar.toUpperCase()}`,
  };

  const { newLineWord, successKey, failKey, isUpdatePoint } =
    inputMode === "roma" ? romaInput(typingInput, { ...typingWord }) : kanaInput(typingInput, { ...typingWord });

  return {
    nextTypingWord: newLineWord,
    successKey,
    failKey,
    chunkType: typingWord.nextChunk.type,
    isCompleted: newLineWord.nextChunk.kana === "",
    updatePoint: isUpdatePoint ? typingWord.nextChunk.point : 0,
  };
};

// const yoonFlickList = ["ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "ゃ", "ゅ", "ょ", "っ", "ゎ"];
// const yoonFlickListLarge = ["あ", "い", "う", "え", "お", "や", "ゆ", "よ", "つ", "わ"];
// const smallKanaList = ["っ", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "ゃ", "ゅ", "ょ", "ゎ", "ヵ", "ヶ", "ん"];
// const OptimisationWhiteList = ["っっ", "っん", "っい", "っう"];

// const kana_mode_convert_rule_before = ["←", "↓", "↑", "→", "『", "』"];
// const kana_mode_convert_rule_after = ["ひだり", "した", "うえ", "みぎ", "「", "」"];
