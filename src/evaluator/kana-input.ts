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
    const isCapsLock = event.getModifierState("CapsLock") ?? false;
    if (isCapsLock && isAlphabet(event.key)) {
      key = event.key === event.key.toUpperCase() ? event.key.toLowerCase() : event.key.toUpperCase();
    } else {
      key = event.key;
    }
  } else {
    key = event.key.toLowerCase();
  }

  const input = {
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
    }
    if (event.code === "KeyZ") {
      input.inputChars[0] = "っ";
    }

    //ATOK入力 https://support.justsystems.com/faq/1032/app/servlet/qadoc?QID=024273
    if (event.code === "KeyV") {
      input.inputChars.push("ゐ", "ヰ");
    }
    if (event.code === "Equal") {
      input.inputChars.push("ゑ", "ヱ");
    }
    if (event.code === "KeyT") {
      input.inputChars.push("ヵ");
    }
    if (event.code === "Quote") {
      input.inputChars.push("ヶ");
    }
    if (event.code === "KeyF") {
      input.inputChars.push("ゎ");
    }
    if (event.code === "Digit0") {
      input.inputChars = ["を"];
    }
  }

  if (KEYBOARD_CHARS.includes(event.key)) {
    input.inputChars.push(
      key,
      key.replace(key, (s) => {
        return String.fromCharCode(s.charCodeAt(0) + 0xfee0);
      }),
    );
  }

  return input;
};

// biome-ignore format: <>
const DAKU_LIST:Dakuten[] = ["ゔ", "が", "ぎ", "ぐ", "げ", "ご", "ざ", "じ", "ず", "ぜ", "ぞ", "だ", "ぢ", "づ", "で", "ど", "ば", "び", "ぶ", "べ", "ぼ"];
const HANDAKU_LIST: HanDakuten[] = ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"];
const DAKU_HANDAKU_LIST = [...DAKU_LIST, ...HANDAKU_LIST];

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
  const newLineWord = { ...lineWord };

  const nextKana = lineWord.nextChunk.kana;
  const firstKanaChar = nextKana.charAt(0);
  const { inputChars } = typingInput;
  const isdakuHandaku = DAKU_HANDAKU_LIST.some((char) => char === firstKanaChar);
  const dakutenInfo = isdakuHandaku ? parseDakuHandaku(firstKanaChar as Dakuten | HanDakuten) : undefined;

  const successIndex: number = inputChars.indexOf(
    dakutenInfo?.seionKana ?? (isCaseSensitive ? firstKanaChar : firstKanaChar.toLowerCase()),
  );

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
    const yoon = nextKana.length >= 2 && dakutenInfo.markType ? nextKana[1] : "";
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

const parseDakuHandaku = (originalKana: Dakuten | HanDakuten) => {
  return {
    markType: DAKU_LIST.some((char) => char === originalKana) ? "゛" : "゜",
    seionKana: DAKU_HANDAKU_NORMALIZE_MAP[originalKana],
    dakuonKana: originalKana,
  } as const;
};

const wordUpdate = (typingKey: string, newLineWord: TypingWord) => {
  const romaPattern = newLineWord.nextChunk.romaPatterns;

  newLineWord.correct.kana += typingKey;
  newLineWord.correct.roma += romaPattern[0];

  newLineWord.nextChunk = newLineWord.wordChunks.shift() || {
    kana: "",
    romaPatterns: [""],
    point: 0,
    type: undefined,
  };
  return { newLineWord, isUpdatePoint: true };
};
