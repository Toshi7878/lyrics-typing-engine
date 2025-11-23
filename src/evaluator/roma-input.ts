import type { TypingWord, WordChunk } from "../type";
import type { TypingKey } from "./type";

export const romaMakeInput = (event: Pick<KeyboardEvent, "key" | "code" | "shiftKey">) => {
  const input = {
    keys: [event.key.toLowerCase()],
    key: event.key.toLowerCase(),
    code: event.code,
    shift: event.shiftKey,
  };

  return input;
};

const Z_COMMAND_MAP = {
  "...": {
    kana: "...",
    romaPatterns: ["z.", "z,."],
    // point: CHAR_POINT * 3,
    type: "symbol" as const,
  },
  "..": {
    kana: "..",
    romaPatterns: ["z,"],
    // point: CHAR_POINT * 2,
    type: "symbol" as const,
  },
} satisfies Record<string, Omit<WordChunk, "point">>;

const processedLineWord = (
  typingKeys: TypingKey,
  lineWord: TypingWord,
): { newLineWord: TypingWord; isUpdatePoint: boolean } => {
  const processNNRouteKey = (lineWord: TypingWord) => {
    const newLineWord = { ...lineWord };
    if (!newLineWord.wordChunks[0]) return { newLineWord: lineWord, isUpdatePoint: false };
    newLineWord.correct.kana += "ん";
    newLineWord.nextChunk = newLineWord.wordChunks[0];
    newLineWord.wordChunks.splice(0, 1);
    return { newLineWord, isUpdatePoint: true };
  };

  const zCommand = (lineWord: TypingWord) => {
    const newLineWord = { ...lineWord };
    const doublePeriod = newLineWord.nextChunk.kana === "." && newLineWord.wordChunks[0]?.kana === ".";
    const charPoint = newLineWord.nextChunk.point;
    if (doublePeriod) {
      const triplePeriod = doublePeriod && newLineWord.wordChunks[1]?.kana === ".";
      if (triplePeriod) {
        newLineWord.nextChunk = {
          ...structuredClone(Z_COMMAND_MAP["..."]),
          point: charPoint * 3,
        };
        newLineWord.wordChunks.splice(0, 2);
      } else {
        newLineWord.nextChunk = {
          ...structuredClone(Z_COMMAND_MAP[".."]),
          point: charPoint * 2,
        };
        newLineWord.wordChunks.splice(0, 1);
      }
    }
    return { newLineWord, isUpdatePoint: false };
  };

  if (typingKeys.code === "KeyX" || typingKeys.code === "KeyW") {
    const expectedNextKeyMap = {
      KeyX: "ん",
      KeyW: "う",
    } as const;
    const expectedNextKey = expectedNextKeyMap[typingKeys.code];
    const isNNRoute =
      lineWord.nextChunk.kana === "ん" &&
      lineWord.correct.roma.slice(-1) === "n" &&
      lineWord.nextChunk.romaPatterns[0] === "n";
    const isNext = lineWord.wordChunks[0]?.kana === expectedNextKey;

    if (isNNRoute && isNext) {
      return processNNRouteKey(lineWord);
    }

    return { newLineWord: lineWord, isUpdatePoint: false };
  }

  if (typingKeys.code === "KeyZ" && !typingKeys.shift) {
    return zCommand(lineWord);
  }

  return { newLineWord: lineWord, isUpdatePoint: false };
};

export const romaInput = (
  typingKeys: TypingKey,
  lineWord: TypingWord,
): {
  newLineWord: TypingWord;
  successKey: string | undefined;
  failKey: string | undefined;
  isUpdatePoint: boolean;
} => {
  let { newLineWord, isUpdatePoint } = processedLineWord(typingKeys, lineWord);

  const nextRomaPattern: string[] = newLineWord.nextChunk.romaPatterns;
  const kana = lineWord.nextChunk.kana;
  const isSuccess = nextRomaPattern.some((pattern) => pattern[0] && pattern[0].toLowerCase() === typingKeys.keys[0]);

  if (!isSuccess || !typingKeys.keys[0]) {
    return {
      newLineWord,
      successKey: undefined,
      failKey: typingKeys.key,
      isUpdatePoint: false,
    };
  }

  if (kana === "ん" && newLineWord.wordChunks[0]) {
    newLineWord.wordChunks[0].romaPatterns = nextNNFilter(typingKeys.keys[0], newLineWord.wordChunks[0].romaPatterns);
  }

  newLineWord.nextChunk.romaPatterns = updateNextRomaPattern(typingKeys.keys[0], nextRomaPattern);

  newLineWord = kanaFilter(kana, typingKeys.keys[0], newLineWord);
  const result = wordUpdate(typingKeys.keys[0], newLineWord, isUpdatePoint);

  return { ...result, successKey: typingKeys.keys[0], failKey: undefined };
};

const updateNextRomaPattern = (eventKey: TypingKey["keys"][number], nextRomaPattern: string[]) => {
  return nextRomaPattern
    .map((pattern) => (pattern.startsWith(eventKey) ? pattern.slice(1) : ""))
    .filter((pattern) => pattern !== "");
};

const kanaFilter = (kana: string, eventKey: TypingKey["keys"][number], newLineWord: TypingWord) => {
  const romaPattern = newLineWord.nextChunk.romaPatterns;
  if (kana.length >= 2 && romaPattern[0]) {
    const isSokuon = kana[0] === "っ" && (eventKey === "u" || romaPattern[0][0] === eventKey);
    const isYoon = kana[0] !== "っ" && (romaPattern[0][0] === "x" || romaPattern[0][0] === "l");

    if (isSokuon || isYoon) {
      newLineWord.correct.kana += newLineWord.nextChunk.kana.slice(0, 1);
      newLineWord.nextChunk.kana = newLineWord.nextChunk.kana.slice(1);
    }
  }

  return newLineWord;
};

const nextNNFilter = (eventKey: TypingKey["keys"][number], nextToNextChar: string[]) => {
  const isXN = eventKey === "x" && nextToNextChar[0] && nextToNextChar[0][0] !== "n" && nextToNextChar[0][0] !== "N";

  if (isXN) {
    return nextToNextChar.filter((value: string) => {
      return value.match(/^(?!(n|')).*$/);
    });
  }

  return nextToNextChar;
};

const wordUpdate = (eventKey: TypingKey["key"][number], newLineWord: TypingWord, _isUpdatePoint: boolean) => {
  const kana = newLineWord.nextChunk.kana;
  const romaPattern = newLineWord.nextChunk.romaPatterns;
  let isUpdatePoint = _isUpdatePoint;

  if (!romaPattern.length) {
    newLineWord.correct.kana += kana;
    isUpdatePoint = true;
    newLineWord.nextChunk = newLineWord.wordChunks.shift() || {
      kana: "",
      romaPatterns: [""],
      point: 0,
      type: undefined,
    };
  }

  newLineWord.correct.roma += eventKey;

  return { newLineWord, isUpdatePoint };
};
