import type { TypingWord, WordChunk } from "../type";
import { isAlphabet } from "../utils/is-alphabet";
import type { TypingInput } from "./type";

export const romaMakeInput = (
  event: Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "getModifierState">,
  isCaseSensitive: boolean,
  nextChunk: WordChunk,
): TypingInput => {
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

  return {
    inputChars: [key],
    key,
    code: event.code,
    shift: event.shiftKey,
  };
};

const Z_COMMAND_MAP = {
  "...": {
    kana: "...",
    romaPatterns: ["z.", "z,."],
    type: "symbol" as const,
  },
  "..": {
    kana: "..",
    romaPatterns: ["z,"],
    type: "symbol" as const,
  },
} satisfies Record<string, Omit<WordChunk, "point">>;

const processNNRouteKey = (lineWord: TypingWord): { newLineWord: TypingWord; isUpdatePoint: boolean } => {
  const nextChunk = lineWord.wordChunks[0];
  if (!nextChunk) return { newLineWord: lineWord, isUpdatePoint: false };

  lineWord.correct.kana += "ん";
  lineWord.nextChunk = nextChunk;
  lineWord.wordChunks.splice(0, 1);
  return { newLineWord: lineWord, isUpdatePoint: true };
};

const zCommand = (lineWord: TypingWord): { newLineWord: TypingWord; isUpdatePoint: boolean } => {
  const nextChunk = lineWord.nextChunk;
  const firstChunk = lineWord.wordChunks[0];
  const secondChunk = lineWord.wordChunks[1];

  const doublePeriod = nextChunk.kana === "." && firstChunk?.kana === ".";

  if (doublePeriod) {
    const charPoint = nextChunk.point;
    const triplePeriod = doublePeriod && secondChunk?.kana === ".";

    if (triplePeriod) {
      lineWord.nextChunk = {
        ...Z_COMMAND_MAP["..."],
        romaPatterns: [...Z_COMMAND_MAP["..."].romaPatterns],
        point: charPoint * 3,
      };
      lineWord.wordChunks.splice(0, 2);
    } else {
      lineWord.nextChunk = {
        ...Z_COMMAND_MAP[".."],
        romaPatterns: [...Z_COMMAND_MAP[".."].romaPatterns],
        point: charPoint * 2,
      };
      lineWord.wordChunks.splice(0, 1);
    }
  }
  return { newLineWord: lineWord, isUpdatePoint: false };
};

const processedLineWord = (
  typingInput: TypingInput,
  lineWord: TypingWord,
): { newLineWord: TypingWord; isUpdatePoint: boolean } => {
  const code = typingInput.code;

  if (code === "KeyX" || code === "KeyW") {
    const expectedNextKey = code === "KeyX" ? "ん" : "う";
    const nextChunk = lineWord.nextChunk;
    const correctRoma = lineWord.correct.roma;

    const lastRomaChar = correctRoma.length > 0 ? correctRoma[correctRoma.length - 1] : "";

    const isNNRoute = nextChunk.kana === "ん" && lastRomaChar === "n" && nextChunk.romaPatterns[0] === "n";

    const isNext = lineWord.wordChunks[0]?.kana === expectedNextKey;

    if (isNNRoute && isNext) {
      return processNNRouteKey(lineWord);
    }

    return { newLineWord: lineWord, isUpdatePoint: false };
  }

  if (code === "KeyZ" && !typingInput.shift) {
    return zCommand(lineWord);
  }

  return { newLineWord: lineWord, isUpdatePoint: false };
};

const updateNextRomaPattern = (eventKey: string, nextRomaPattern: string[]): string[] => {
  const result: string[] = [];
  const len = nextRomaPattern.length;
  for (let i = 0; i < len; i++) {
    const pattern = nextRomaPattern[i];
    if (pattern && pattern.startsWith(eventKey)) {
      const sliced = pattern.slice(1);
      if (sliced !== "") {
        result.push(sliced);
      }
    }
  }
  return result;
};

const kanaFilter = (kana: string, eventKey: string, newLineWord: TypingWord) => {
  const romaPattern = newLineWord.nextChunk.romaPatterns;
  if (kana.length >= 2 && romaPattern[0]) {
    const firstRomaChar = romaPattern[0][0];
    const isSokuon = kana[0] === "っ" && (eventKey === "u" || firstRomaChar === eventKey);
    const isYoon = kana[0] !== "っ" && (firstRomaChar === "x" || firstRomaChar === "l");

    if (isSokuon || isYoon) {
      newLineWord.correct.kana += newLineWord.nextChunk.kana.slice(0, 1);
      newLineWord.nextChunk.kana = newLineWord.nextChunk.kana.slice(1);
    }
  }

  return newLineWord;
};

const nextNNFilter = (eventKey: string, nextToNextChar: string[]) => {
  const isXN = eventKey === "x" && nextToNextChar[0] && nextToNextChar[0][0] !== "n" && nextToNextChar[0][0] !== "N";

  if (isXN) {
    const result: string[] = [];
    const len = nextToNextChar.length;
    for (let i = 0; i < len; i++) {
      const value = nextToNextChar[i];
      if (value && !value.startsWith("n") && !value.startsWith("'")) {
        result.push(value);
      }
    }
    return result;
  }

  return nextToNextChar;
};

const wordUpdate = (eventKey: string, newLineWord: TypingWord, _isUpdatePoint: boolean) => {
  const romaPattern = newLineWord.nextChunk.romaPatterns;
  let isUpdatePoint = _isUpdatePoint;

  if (romaPattern.length === 0) {
    newLineWord.correct.kana += newLineWord.nextChunk.kana;
    isUpdatePoint = true;

    const nextChunk = newLineWord.wordChunks.shift();
    if (nextChunk) {
      newLineWord.nextChunk = nextChunk;
    } else {
      newLineWord.nextChunk = {
        kana: "",
        romaPatterns: [""],
        point: 0,
        type: undefined,
      };
    }
  }

  newLineWord.correct.roma += eventKey;

  return { newLineWord, isUpdatePoint };
};

export const romaInput = (
  typingInput: TypingInput,
  lineWord: TypingWord,
  isCaseSensitive: boolean,
): {
  newLineWord: TypingWord;
  successKey: string | undefined;
  failKey: string | undefined;
  isUpdatePoint: boolean;
} => {
  const workingWord: TypingWord = {
    correct: { ...lineWord.correct },
    nextChunk: { ...lineWord.nextChunk },
    wordChunks: [...lineWord.wordChunks],
  };

  const { newLineWord, isUpdatePoint } = processedLineWord(typingInput, workingWord);

  const nextRomaPattern = newLineWord.nextChunk.romaPatterns;
  const inputChar = typingInput.inputChars[0];

  if (!inputChar) {
    return {
      newLineWord,
      successKey: undefined,
      failKey: typingInput.key,
      isUpdatePoint: false,
    };
  }

  let isSuccess = false;
  const patternLen = nextRomaPattern.length;
  if (isCaseSensitive) {
    for (let i = 0; i < patternLen; i++) {
      const pattern = nextRomaPattern[i];
      if (pattern && pattern.charAt(0) === inputChar) {
        isSuccess = true;
        break;
      }
    }
  } else {
    for (let i = 0; i < patternLen; i++) {
      const pattern = nextRomaPattern[i];
      if (pattern && pattern.charAt(0).toLowerCase() === inputChar) {
        isSuccess = true;
        break;
      }
    }
  }

  if (!isSuccess) {
    return {
      newLineWord,
      successKey: undefined,
      failKey: typingInput.key,
      isUpdatePoint: false,
    };
  }

  const currentKana = newLineWord.nextChunk.kana;

  if (currentKana === "ん" && newLineWord.wordChunks[0]) {
    newLineWord.wordChunks[0].romaPatterns = nextNNFilter(inputChar, newLineWord.wordChunks[0].romaPatterns);
  }

  newLineWord.nextChunk.romaPatterns = updateNextRomaPattern(inputChar, nextRomaPattern);

  const filteredWord = kanaFilter(currentKana, inputChar, newLineWord);

  const result = wordUpdate(inputChar, filteredWord, isUpdatePoint);

  return { ...result, successKey: inputChar, failKey: undefined };
};
