import type { Dakuten, HanDakuten, LineWord, NormalizeHirakana } from "../type";
import { CODE_TO_KANA, KEY_TO_KANA, KEYBOARD_CHARS } from "./const";
import type { TypingKey } from "./type";

export const kanaMakeInput = (event: Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "keyCode">) => {
  const codeKanaKey = CODE_TO_KANA.get(event.code);
  const keyToKanaResult = KEY_TO_KANA.get(event.key) ?? [""];
  const input = {
    keys: codeKanaKey ? [...codeKanaKey] : [...keyToKanaResult],
    key: event.key.toLowerCase(),
    code: event.code,
    shift: event.shiftKey,
  };

  if (event.keyCode === 0) {
    input.keys = ["ー", "￥", "\\"];
  } else if (event.shiftKey) {
    if (event.code === "KeyE") {
      input.keys[0] = "ぃ";
    }
    if (event.code === "KeyZ") {
      input.keys[0] = "っ";
    }

    //ATOK入力 https://support.justsystems.com/faq/1032/app/servlet/qadoc?QID=024273
    if (event.code === "KeyV") {
      input.keys.push("ゐ", "ヰ");
    }
    if (event.code === "Equal") {
      input.keys.push("ゑ", "ヱ");
    }
    if (event.code === "KeyT") {
      input.keys.push("ヵ");
    }
    if (event.code === "Quote") {
      input.keys.push("ヶ");
    }
    if (event.code === "KeyF") {
      input.keys.push("ゎ");
    }
    if (event.code === "Digit0") {
      input.keys = ["を"];
    }
  }

  if (KEYBOARD_CHARS.includes(event.key)) {
    input.keys.push(
      event.key.toLowerCase(),
      event.key.toLowerCase().replace(event.key.toLowerCase(), (s) => {
        return String.fromCharCode(s.charCodeAt(0) + 0xfee0);
      }),
    );
  }

  return input;
};

interface DakuHandakuData {
  type: "" | "゛" | "゜";
  normalizedKana: "" | NormalizeHirakana;
  originalKana: "" | Dakuten | HanDakuten;
}
// biome-ignore format: <>
const DAKU_LIST:Dakuten[] = ["ゔ", "が", "ぎ", "ぐ", "げ", "ご", "ざ", "じ", "ず", "ぜ", "ぞ", "だ", "ぢ", "づ", "で", "ど", "ば", "び", "ぶ", "べ", "ぼ"];
const HANDAKU_LIST: HanDakuten[] = ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ"];
const DAKU_HANDAKU_LIST = [...DAKU_LIST, ...HANDAKU_LIST];

export const kanaInput = (
  typingKeys: TypingKey,
  lineWord: LineWord,
): {
  newLineWord: LineWord;
  successKey: string | undefined;
  failKey: string | undefined;
  isUpdatePoint: boolean;
} => {
  const newLineWord = { ...lineWord };

  const nextKana = lineWord.nextChunk.kana;
  const firstKanaChar = nextKana.charAt(0);
  const { keys } = typingKeys;
  const isdakuHandaku = DAKU_HANDAKU_LIST.some((char) => char === firstKanaChar);

  const dakuHanDakuData: DakuHandakuData | undefined = isdakuHandaku
    ? parseDakuHandaku(firstKanaChar as Dakuten | HanDakuten)
    : undefined;

  const successIndex: number = firstKanaChar
    ? keys.indexOf(dakuHanDakuData?.normalizedKana ? dakuHanDakuData.normalizedKana : firstKanaChar.toLowerCase())
    : -1;

  const typingKey =
    keys[successIndex] === "゛" || keys[successIndex] === "゜"
      ? newLineWord.nextChunk.orginalDakuChar
      : keys[successIndex];

  if (!typingKey) {
    const isKanaInArray = !KEYBOARD_CHARS.includes(firstKanaChar);
    return {
      newLineWord,
      successKey: "",
      failKey: isKanaInArray ? typingKeys.keys[0] : typingKeys.key,
      isUpdatePoint: false,
    };
  }

  if (dakuHanDakuData?.type) {
    const yoon = nextKana.length >= 2 && dakuHanDakuData.type ? nextKana[1] : "";
    newLineWord.nextChunk.kana = dakuHanDakuData.type + yoon;
    newLineWord.nextChunk.orginalDakuChar = dakuHanDakuData.originalKana as Dakuten | HanDakuten;
  } else if (nextKana.length >= 2) {
    newLineWord.correct.kana += typingKey;
    newLineWord.nextChunk.kana = newLineWord.nextChunk.kana.slice(1);
  } else {
    const result = wordUpdate(typingKey, newLineWord);
    return { ...result, successKey: keys[successIndex], failKey: undefined };
  }

  return {
    newLineWord,
    successKey: keys[successIndex],
    failKey: undefined,
    isUpdatePoint: false,
  };
};

const parseDakuHandaku = (originalKana: Dakuten | HanDakuten): DakuHandakuData => {
  const type: "" | "゛" | "゜" = DAKU_LIST.some((char) => char === originalKana) ? "゛" : "゜";
  const normalizedKana: "" | NormalizeHirakana = originalKana.normalize("NFD")[0] as NormalizeHirakana;
  return { type, normalizedKana, originalKana };
};

const wordUpdate = (typingKey: string, newLineWord: LineWord) => {
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
