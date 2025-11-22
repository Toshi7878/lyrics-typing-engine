import type { BuiltMapLine, MapJsonLine, WordChunk } from "../type";
import { zip } from "../utils/array";
import { countKanaWordWithDakuonSplit } from "../utils/kana";
import { buildTypingWord } from "./build-word";
import { parseKanaChunks } from "./parse-kana-chunks";

export const buildTypingMap = <TOptions = unknown>({
  mapJson,
  charPoint,
}: {
  mapJson: MapJsonLine<TOptions>[];
  charPoint: number;
}): BuiltMapLine<TOptions>[] => {
  const wordsData: BuiltMapLine<TOptions>[] = [];

  const kanaChunks = parseKanaChunks(mapJson.map((line) => line.word).join("\n"));
  for (const [i, [mapLine, kanaChunkWord]] of zip(mapJson, kanaChunks).entries()) {
    const line = {
      time: Number(mapLine.time),
      lyrics: mapLine.lyrics,
      kanaWord: kanaChunkWord.join(""),
      wordChunks: buildTypingWord({ kanaChunkWord, charPoint }),
      options: mapLine.options,
    };

    const hasWord = !!kanaChunkWord.length;
    const nextLine = mapJson[i + 1];
    if (hasWord && line.lyrics !== "end" && nextLine) {
      const notes = calcLineNotes(line.wordChunks);
      wordsData.push({
        kpm: calcLineKpm({
          notes,
          lineDuration: Number(nextLine.time) - line.time,
        }),
        notes,
        ...line,
      });
    } else {
      wordsData.push({
        kpm: { kana: 0, roma: 0 },
        notes: { kana: 0, roma: 0 },
        ...line,
      });
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
