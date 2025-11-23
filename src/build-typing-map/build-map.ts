import type { BuiltMapLine, RawMapLine, WordChunk } from "../type";
import { zip } from "../utils/array";
import { countKanaWordWithDakuonSplit } from "../utils/kana";
import { parseKanaChunks } from "./parse-kana-chunks";
import { parseKanaToWordChunks } from "./parse-kana-to-word-chunks";

export const buildTypingMap = <TOptions = unknown>({
  rawMapLines,
  charPoint,
}: {
  rawMapLines: RawMapLine<TOptions>[];
  charPoint: number;
}): BuiltMapLine<TOptions>[] => {
  const builtMapLines: BuiltMapLine<TOptions>[] = [];

  const kanaChunksLines = parseKanaChunks(rawMapLines.map((line) => line.word).join("\n"));
  for (const [i, [rawMapLine, kanaChunks]] of zip(rawMapLines, kanaChunksLines).entries()) {
    const wordChunks = parseKanaToWordChunks({ kanaChunks, charPoint });
    const nextLine = rawMapLines[i + 1];
    const lineDuration = nextLine ? Math.floor((Number(nextLine.time) - Number(rawMapLine.time)) * 1000) / 1000 : 0;

    const builtLine = {
      time: Number(rawMapLine.time),
      duration: lineDuration,
      wordChunks,
      lyrics: rawMapLine.lyrics,
      kanaLyrics: kanaChunks.join(""),
      romaLyrics: wordChunks.map((chunk) => chunk.romaPatterns[0]).join(""),
      options: rawMapLine.options,
    };

    const hasWord = !!kanaChunks.length;
    if (hasWord && builtLine.lyrics !== "end" && nextLine) {
      const notes = calcLineNotes(builtLine.wordChunks);
      builtMapLines.push({ ...builtLine, kpm: calcLineKpm({ notes, lineDuration }), notes });
    } else {
      builtMapLines.push({ ...builtLine, kpm: { kana: 0, roma: 0 }, notes: { kana: 0, roma: 0 } });
    }
  }

  return builtMapLines;
};

const calcLineKpm = ({ notes, lineDuration: remainTime }: { notes: BuiltMapLine["notes"]; lineDuration: number }) => {
  const romaKpm = Math.max(1, Math.floor((notes.roma / remainTime) * 60));
  const kanaKpm = Math.max(1, Math.floor((notes.kana / remainTime) * 60));
  return { roma: romaKpm, kana: kanaKpm };
};

const calcLineNotes = (word: WordChunk[]) => {
  const kanaWord = word.map((item) => item.kana).join("");
  const kanaNotes = countKanaWordWithDakuonSplit({ kanaWord });
  const romaNotes = word.map((item) => item.romaPatterns[0]).join("").length;

  return { kana: kanaNotes, roma: romaNotes };
};
