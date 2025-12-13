import type { Dakuten, HanDakuten, TypingWord, WordChunk } from "../type";
import { isAlphabet } from "../utils/is-alphabet";
import { CODE_TO_KANA, DAKU_HANDAKU_NORMALIZE_MAP, KEY_TO_KANA, KEYBOARD_CHARS } from "./const";
import type { TypingInput } from "./type";

export const kanaMakeInput = (
  event: Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "keyCode" | "getModifierState">,
  isCaseSensitive: boolean,
  nextChunk: WordChunk,
): TypingInput => {
  const codeKanaKey = CODE_TO_KANA.get(event.code);
  const keyToKanaResult = KEY_TO_KANA.get(event.key) ?? [""];

  let key: string;
  if (isCaseSensitive && nextChunk.type === "alphabet") {
    const isCapsLock = event.getModifierState?.("CapsLock") ?? false;
    if (isCapsLock && isAlphabet(event.key)) {
      key = event.key === event.key.toUpperCase() ? event.key.toLowerCase() : event.key.toUpperCase();
    } else {
      key = event.key;
    }
  } else {
    key = event.key.toLowerCase();
  }

  const input: TypingInput = {
    inputChars: codeKanaKey ? [...codeKanaKey] : [...keyToKanaResult],
    key,
    code: event.code,
    shift: event.shiftKey,
  };

  if (event.keyCode === 0) {
    input.inputChars = ["ー", "￥", "\\"];
  } else if (event.shiftKey) {
    if (event.code === "KeyE") {
      input.inputChars[0] = "ぃ";
    } else if (event.code === "KeyZ") {
      input.inputChars[0] = "っ";
    }

    //ATOK入力 https://support.justsystems.com/faq/1032/app/servlet/qadoc?QID=024273
    else if (event.code === "KeyV") {
      input.inputChars.push("ゐ", "ヰ");
    } else if (event.code === "Equal") {
      input.inputChars.push("ゑ", "ヱ");
    } else if (event.code === "KeyT") {
      input.inputChars.push("ヵ");
    } else if (event.code === "Quote") {
      input.inputChars.push("ヶ");
    } else if (event.code === "KeyF") {
      input.inputChars.push("ゎ");
    } else if (event.code === "Digit0") {
      input.inputChars = ["を"];
    }
  }

  if (KEYBOARD_CHARS.includes(event.key)) {
    input.inputChars.push(
      key,
      key.replace(key, (s) => String.fromCharCode(s.charCodeAt(0) + 0xfee0)),
    );
  }

  return input;
};

// Setを使用して検索をO(1)にする
const DAKU_SET = new Set([
  "ゔ",
  "が",
  "ぎ",
  "ぐ",
  "げ",
  "ご",
  "ざ",
  "じ",
  "ず",
  "ぜ",
  "ぞ",
  "だ",
  "ぢ",
  "づ",
  "で",
  "ど",
  "ば",
  "び",
  "ぶ",
  "べ",
  "ぼ",
]);
const HANDAKU_SET = new Set(["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"]);

export const kanaInput = (
  typingInput: TypingInput,
  lineWord: TypingWord,
  isCaseSensitive: boolean,
): {
  newLineWord: TypingWord;
  successKey: string | undefined;
  failKey: string | undefined;
  isUpdatePoint: boolean;
} => {
  // 副作用を防ぐためにオブジェクトをコピーする
  const workingWord: TypingWord = {
    correct: { ...lineWord.correct },
    nextChunk: { ...lineWord.nextChunk },
    wordChunks: lineWord.wordChunks,
    wordChunksIndex: lineWord.wordChunksIndex,
    tempRomaPatterns: lineWord.tempRomaPatterns,
  };
  const newLineWord = workingWord;

  const nextKana = newLineWord.nextChunk.kana;
  const firstKanaChar = nextKana.charAt(0);
  const { inputChars } = typingInput;

  // Setを使った高速な判定
  const isDaku = DAKU_SET.has(firstKanaChar);
  const isHandaku = !isDaku && HANDAKU_SET.has(firstKanaChar);

  let dakutenInfo: { markType: string; seionKana: string; dakuonKana: string } | undefined;

  if (isDaku) {
    dakutenInfo = {
      markType: "゛",
      seionKana: DAKU_HANDAKU_NORMALIZE_MAP[firstKanaChar as Dakuten] || firstKanaChar,
      dakuonKana: firstKanaChar,
    };
  } else if (isHandaku) {
    dakutenInfo = {
      markType: "゜",
      seionKana: DAKU_HANDAKU_NORMALIZE_MAP[firstKanaChar as HanDakuten] || firstKanaChar,
      dakuonKana: firstKanaChar,
    };
  }

  const targetChar = dakutenInfo
    ? dakutenInfo.seionKana
    : isCaseSensitive
      ? firstKanaChar
      : firstKanaChar.toLowerCase();
  const successIndex: number = inputChars.indexOf(targetChar);

  const typingKey =
    inputChars[successIndex] === "゛" || inputChars[successIndex] === "゜"
      ? newLineWord.nextChunk.originalDakutenChar
      : inputChars[successIndex];

  if (!typingKey) {
    const isKanaInArray = !KEYBOARD_CHARS.includes(firstKanaChar);
    return {
      newLineWord,
      successKey: "",
      failKey: isKanaInArray ? typingInput.inputChars[0] : typingInput.key,
      isUpdatePoint: false,
    };
  }

  if (dakutenInfo?.markType) {
    const yoon = nextKana.length >= 2 ? nextKana[1] : "";
    newLineWord.nextChunk.kana = dakutenInfo.markType + yoon;
    newLineWord.nextChunk.originalDakutenChar = dakutenInfo.dakuonKana as Dakuten | HanDakuten;
  } else if (nextKana.length >= 2) {
    newLineWord.correct.kana += typingKey;
    newLineWord.nextChunk.kana = newLineWord.nextChunk.kana.slice(1);
  } else {
    const result = wordUpdate(typingKey, newLineWord);
    return { ...result, successKey: inputChars[successIndex], failKey: undefined };
  }

  return {
    newLineWord,
    successKey: inputChars[successIndex],
    failKey: undefined,
    isUpdatePoint: false,
  };
};

const wordUpdate = (typingKey: string, newLineWord: TypingWord) => {
  const romaPattern = newLineWord.nextChunk.romaPatterns;

  newLineWord.correct.kana += typingKey;
  // romaPatternsが空の場合の安全策
  newLineWord.correct.roma += romaPattern && romaPattern.length > 0 ? romaPattern[0] : "";

  const nextChunk = newLineWord.wordChunks[newLineWord.wordChunksIndex];
  if (nextChunk) {
    newLineWord.nextChunk = nextChunk;
    newLineWord.wordChunksIndex++;
  } else {
    newLineWord.nextChunk = {
      kana: "",
      romaPatterns: [""],
      point: 0,
      type: undefined,
    };
  }
  return { newLineWord, isUpdatePoint: true };
};
