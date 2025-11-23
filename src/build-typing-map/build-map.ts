import type { BuiltMapLine, MapJsonLine, WordChunk } from "../type";
import { zip } from "../utils/array";
import { countKanaWordWithDakuonSplit } from "../utils/kana";
import { parseKanaChunks } from "./parse-kana-chunks";
import { parseKanaToWordChunks } from "./parse-kana-to-word-chunks";

export const buildTypingMap = <TOptions = unknown>({
  mapJson,
  charPoint,
}: {
  mapJson: MapJsonLine<TOptions>[];
  charPoint: number;
}): BuiltMapLine<TOptions>[] => {
  const wordsData: BuiltMapLine<TOptions>[] = [];

  const kanaChunksLines = parseKanaChunks(mapJson.map((line) => line.word).join("\n"));
  for (const [i, [mapLine, kanaChunks]] of zip(mapJson, kanaChunksLines).entries()) {
    const wordChunks = parseKanaToWordChunks({ kanaChunks, charPoint });
    const nextLine = mapJson[i + 1];
    const lineDuration = nextLine ? Math.floor((Number(nextLine.time) - Number(mapLine.time)) * 1000) / 1000 : 0;

    const line = {
      time: Number(mapLine.time),
      duration: lineDuration,
      wordChunks,
      lyrics: mapLine.lyrics,
      kanaLyrics: kanaChunks.join(""),
      romaLyrics: wordChunks.map((chunk) => chunk.romaPatterns[0]).join(""),
      options: mapLine.options,
    };

    const hasWord = !!kanaChunks.length;
    if (hasWord && line.lyrics !== "end" && nextLine) {
      const notes = calcLineNotes(line.wordChunks);
      wordsData.push({ ...line, kpm: calcLineKpm({ notes, lineDuration }), notes });
    } else {
      wordsData.push({ ...line, kpm: { kana: 0, roma: 0 }, notes: { kana: 0, roma: 0 } });
    }
  }

  return wordsData;
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
