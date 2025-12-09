import type { WordChunk } from "../type";
import { isAlphabet } from "../utils/is-alphabet";
import { convertZenkakuToHankaku } from "../utils/zenkaku-to-hankaku";
import { NUM_LIST, ROMA_MAP, SYMBOL_TO_ROMA_MAP } from "./const";

// biome-ignore format:<>
const NN_LIST = ["あ", "い", "う", "え", "お", "な", "に", "ぬ", "ね", "の", "や", "ゆ", "よ", "ん", "'", "’", "a", "i", "u", "e", "o", "y", "n", "A", "I", "U", "E", "O", "Y", "N"];
// biome-ignore format:<>
const SOKUON_JOIN_LIST = ["ヰ", "ゐ", "ヱ", "ゑ", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ", "ゃ", "ゅ", "ょ", "っ", "ゎ", "ヵ", "ヶ", "ゔ", "か", "き", "く", "け", "こ", "さ", "し", "す", "せ", "そ", "た", "ち", "つ", "て", "と", "は", "ひ", "ふ", "へ", "ほ", "ま", "み", "む", "め", "も", "や", "ゆ", "よ", "ら", "り", "る", "れ", "ろ", "わ", "を", "が", "ぎ", "ぐ", "げ", "ご", "ざ", "じ", "ず", "ぜ", "ぞ", "だ", "ぢ", "づ", "で", "ど", "ば", "び", "ぶ", "べ", "ぼ", "ぱ", "ぴ", "ぷ", "ぺ", "ぽ"];
const KANA_UNSUPPORTED_SYMBOLS = ["←", "↓", "↑", "→"];

export const parseKanaChunksToWordChunks = ({
  kanaChunks,
  charPoint = 0,
}: {
  kanaChunks: string[];
  charPoint: number;
}) => {
  const hasWord = !!kanaChunks.length;

  if (hasWord) {
    return buildWordChunks(kanaChunks, charPoint);
  }

  return [{ kana: "", romaPatterns: [""], point: 0, type: undefined }];
};

const buildWordChunks = (kanaChunks: string[], charPoint: number) => {
  let wordChunks: WordChunk[] = [];

  for (const kanaChunk of kanaChunks) {
    const romaPatterns = [
      ...(ROMA_MAP.get(kanaChunk) || SYMBOL_TO_ROMA_MAP.get(kanaChunk) || [convertZenkakuToHankaku(kanaChunk)]),
    ];

    if (!romaPatterns[0]) return wordChunks;

    wordChunks.push({
      kana: kanaChunk,
      romaPatterns,
      point: charPoint * romaPatterns[0].length,
      type: determineCharacterType({
        kanaChar: kanaChunk,
        romaChar: romaPatterns[0],
      }),
      ...(KANA_UNSUPPORTED_SYMBOLS.includes(kanaChunk) && {
        kanaUnSupportedSymbol: kanaChunk,
      }),
    });

    //打鍵パターンを正規化 (促音結合 / n → nn)
    // ============================================================================================

    if (wordChunks.length >= 2) {
      const prevKanaChar = wordChunks[wordChunks.length - 2]?.kana;
      const currentKanaChar = wordChunks[wordChunks.length - 1]?.kana[0];

      if (prevKanaChar?.[prevKanaChar.length - 1] === "っ" && currentKanaChar) {
        if (SOKUON_JOIN_LIST.includes(currentKanaChar)) {
          wordChunks = joinSokuonPattern({
            wordChunks: wordChunks,
            joinType: "normal",
            charPoint,
          });
        } else if (["い", "う", "ん"].includes(currentKanaChar)) {
          wordChunks = joinSokuonPattern({
            wordChunks: wordChunks,
            joinType: "iun",
            charPoint,
          });
        }
      }
    }

    const prevKanaChar = wordChunks[wordChunks.length - 2]?.kana ?? "";
    const currentFirstKanaChar = wordChunks[wordChunks.length - 1]?.kana[0];

    if (
      prevKanaChar[prevKanaChar.length - 1] === "ん" &&
      currentFirstKanaChar &&
      NN_LIST.includes(currentFirstKanaChar)
    ) {
      wordChunks = replaceNWithNN(wordChunks, charPoint);
    }
  }

  //this.kanaArray最後の文字が「ん」だった場合も[nn]に置き換えます。
  const lastChunk = wordChunks.at(-1);
  if (lastChunk?.kana === "ん") {
    lastChunk.romaPatterns[0] = "nn";
    lastChunk.romaPatterns.push("n'");
    lastChunk.point = charPoint * lastChunk.romaPatterns[0].length;
  }

  return wordChunks;
};

const replaceNWithNN = (typeChunks: WordChunk[], charPoint: number) => {
  const prevChunk = typeChunks.at(-2);
  if (!prevChunk) return typeChunks;

  const prevRomaPatterns = prevChunk.romaPatterns;

  for (const [i, romaPattern] of prevRomaPatterns.entries()) {
    const isNNPattern =
      (romaPattern.length >= 2 &&
        romaPattern[romaPattern.length - 2] !== "x" &&
        romaPattern[romaPattern.length - 1] === "n") ||
      romaPattern === "n";

    if (isNNPattern && romaPattern) {
      prevChunk.romaPatterns[i] = `${romaPattern}n`;
      prevChunk.romaPatterns.push("n'");
      prevChunk.point = charPoint * romaPattern.length;
    }
  }

  return typeChunks;
};

const joinSokuonPattern = ({
  joinType,
  wordChunks,
  charPoint,
}: {
  joinType: "normal" | "iun";
  wordChunks: WordChunk[];
  charPoint: number;
}) => {
  const continuous: string[] = [];
  const xtu: string[] = [];
  const ltu: string[] = [];
  const xtsu: string[] = [];
  const ltsu: string[] = [];

  const prevChunk = wordChunks.at(-2);
  const currentChunk = wordChunks.at(-1);
  if (!prevChunk || !currentChunk) return wordChunks;

  const prevKanaChar = prevChunk.kana;
  const currentKanaChar = currentChunk.kana;

  currentChunk.kana = prevKanaChar + currentKanaChar;
  wordChunks.splice(-2, 1);

  const sokuonLength = (prevKanaChar.match(/っ/g) || []).length;
  const lastChunk = wordChunks.at(-1);
  if (!lastChunk) return wordChunks;

  const romaPatterns = lastChunk.romaPatterns;

  for (const romaPattern of romaPatterns) {
    const firstChar = romaPattern[0];
    if (firstChar && (joinType === "normal" || !["i", "u", "n"].includes(firstChar))) {
      continuous.push(firstChar.repeat(sokuonLength) + romaPattern);
    }

    xtu.push(`${"x".repeat(sokuonLength)}tu${romaPattern}`);
    ltu.push(`${"l".repeat(sokuonLength)}tu${romaPattern}`);
    xtsu.push(`${"x".repeat(sokuonLength)}tsu${romaPattern}`);
    ltsu.push(`${"l".repeat(sokuonLength)}tsu${romaPattern}`);
  }

  lastChunk.romaPatterns = [...continuous, ...xtu, ...ltu, ...xtsu, ...ltsu];
  lastChunk.point = charPoint * (lastChunk.romaPatterns[0]?.length ?? 0);

  return wordChunks;
};

const determineCharacterType = ({ kanaChar, romaChar }: { kanaChar: string; romaChar: string }): WordChunk["type"] => {
  if (ROMA_MAP.has(kanaChar)) {
    return "kana";
  }

  if (isAlphabet(romaChar)) {
    return "alphabet";
  }

  if (NUM_LIST.includes(romaChar)) {
    return "num";
  }

  if (romaChar === " ") {
    return "space";
  }

  return "symbol";
};
