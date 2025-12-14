import type { TypingWord, WordChunk } from "../type";
import { NN_PATTERN_SET } from "../utils/const";
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

const handleExceptionNnPatternInput = (
  lineWord: TypingWord,
  code: string,
): { newLineWord: TypingWord; isUpdatePoint: boolean } => {
  const expectedNextKey = code === "KeyX" ? "ん" : "う";
  const nextChunk = lineWord.nextChunk;
  const correctRoma = lineWord.correct.roma;

  const lastRomaChar = correctRoma.length > 0 ? correctRoma[correctRoma.length - 1] : "";

  const isNNRoute = nextChunk.kana === "ん" && lastRomaChar === "n" && nextChunk.romaPatterns[0] === "n";

  const nextWordChunk = lineWord.wordChunks[lineWord.wordChunksIndex];
  const isNext = nextWordChunk?.kana === expectedNextKey;

  if (isNNRoute && isNext && nextWordChunk) {
    lineWord.correct.kana += "ん";
    lineWord.nextChunk = nextWordChunk;
    lineWord.wordChunksIndex++;
    return { newLineWord: lineWord, isUpdatePoint: true };
  }

  return { newLineWord: lineWord, isUpdatePoint: false };
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
  const { newLineWord, isUpdatePoint } = processedLineWord(typingInput, {
    correct: { ...lineWord.correct },
    nextChunk: { ...lineWord.nextChunk },
    wordChunks: lineWord.wordChunks,
    wordChunksIndex: lineWord.wordChunksIndex,
    tempRomaPatterns: lineWord.tempRomaPatterns,
  });

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

  const isSuccess = isMatchRomaPattern(nextRomaPattern, inputChar, isCaseSensitive, newLineWord.tempRomaPatterns);

  if (!isSuccess) {
    return { newLineWord, successKey: undefined, failKey: typingInput.key, isUpdatePoint: false };
  }

  newLineWord.nextChunk.romaPatterns = updateNextRomaPattern(inputChar, nextRomaPattern);

  const filteredWord = processSokuonAndYoon(newLineWord.nextChunk.kana, inputChar, newLineWord);

  const result = updateChunk(inputChar, filteredWord, isUpdatePoint);

  return { ...result, successKey: inputChar, failKey: undefined };
};

const processedLineWord = (
  typingInput: TypingInput,
  lineWord: TypingWord,
): { newLineWord: TypingWord; isUpdatePoint: boolean } => {
  const code = typingInput.code;

  if (code === "KeyX" || code === "KeyW") {
    return handleExceptionNnPatternInput(lineWord, code);
  }

  if (code === "KeyZ" && !typingInput.shift) {
    return processZCommand(lineWord);
  }

  return { newLineWord: lineWord, isUpdatePoint: false };
};

const processZCommand = (lineWord: TypingWord): { newLineWord: TypingWord; isUpdatePoint: boolean } => {
  const nextChunk = lineWord.nextChunk;
  const firstChunk = lineWord.wordChunks[lineWord.wordChunksIndex];
  const secondChunk = lineWord.wordChunks[lineWord.wordChunksIndex + 1];

  const doublePeriod = nextChunk.kana === "." && firstChunk?.kana === ".";

  if (doublePeriod) {
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

    const charPoint = nextChunk.point;
    const triplePeriod = doublePeriod && secondChunk?.kana === ".";

    if (triplePeriod) {
      lineWord.nextChunk = {
        ...Z_COMMAND_MAP["..."],
        romaPatterns: [...Z_COMMAND_MAP["..."].romaPatterns],
        point: charPoint * 3,
      };
      lineWord.wordChunksIndex += 2;
    } else {
      lineWord.nextChunk = {
        ...Z_COMMAND_MAP[".."],
        romaPatterns: [...Z_COMMAND_MAP[".."].romaPatterns],
        point: charPoint * 2,
      };
      lineWord.wordChunksIndex += 1;
    }
  }
  return { newLineWord: lineWord, isUpdatePoint: false };
};

const isMatchRomaPattern = (
  nextRomaPattern: string[],
  inputChar: string,
  isCaseSensitive: boolean,
  tempRomaPatterns?: string[],
): boolean => {
  const patternLen = nextRomaPattern.length;
  const tempPatternLen = tempRomaPatterns ? tempRomaPatterns.length : 0;

  if (isCaseSensitive) {
    for (let i = 0; i < patternLen; i++) {
      const pattern = nextRomaPattern[i];
      if (pattern && pattern.charAt(0) === inputChar) {
        return true;
      }
    }
    if (tempPatternLen > 0 && tempRomaPatterns) {
      for (let i = 0; i < tempPatternLen; i++) {
        const pattern = tempRomaPatterns[i];
        if (pattern && pattern.charAt(0) === inputChar) {
          return true;
        }
      }
    }
  } else {
    const lowerInputChar = inputChar.toLowerCase();
    for (let i = 0; i < patternLen; i++) {
      const pattern = nextRomaPattern[i];
      if (pattern && pattern.charAt(0).toLowerCase() === lowerInputChar) {
        return true;
      }
    }
    if (tempPatternLen > 0 && tempRomaPatterns) {
      for (let i = 0; i < tempPatternLen; i++) {
        const pattern = tempRomaPatterns[i];
        if (pattern && pattern.charAt(0).toLowerCase() === lowerInputChar) {
          return true;
        }
      }
    }
  }
  return false;
};

const updateNextRomaPattern = (eventKey: string, nextRomaPattern: string[]): string[] => {
  const result: string[] = [];
  const len = nextRomaPattern.length;
  for (let i = 0; i < len; i++) {
    const pattern = nextRomaPattern[i];
    if (pattern?.startsWith(eventKey)) {
      const sliced = pattern.slice(1);
      if (sliced !== "") {
        result.push(sliced);
      }
    }
  }
  return result;
};

const processSokuonAndYoon = (kana: string, eventKey: string, newLineWord: TypingWord) => {
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

const updateChunk = (eventKey: string, newLineWord: TypingWord, _isUpdatePoint: boolean) => {
  const romaPattern = newLineWord.nextChunk.romaPatterns;
  let isUpdatePoint = _isUpdatePoint;

  if (romaPattern.length === 0) {
    newLineWord.correct.kana += newLineWord.nextChunk.kana;
    isUpdatePoint = true;

    const nextChunk = newLineWord.wordChunks[newLineWord.wordChunksIndex];
    if (nextChunk) {
      newLineWord.nextChunk = nextChunk;
      newLineWord.wordChunksIndex++;

      const lastKanaCorrect = newLineWord.correct.kana.at(-1);
      const lastRomaCorrect = newLineWord.correct.roma.at(-1);
      if (lastKanaCorrect === "ん" && lastRomaCorrect !== "x" && !NN_PATTERN_SET.has(nextChunk.kana)) {
        newLineWord.tempRomaPatterns = ["n", "'"];
      } else {
        newLineWord.tempRomaPatterns = undefined;
      }
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
