# lyrics-typing-engine

音楽に同期したタイピングゲーム用のエンジンライブラリ。歌詞データからタイピングマップを生成し、ローマ字入力・かな入力の判定を行います。

## インストール

```bash
npm install lyrics-typing-engine
```

## 機能

### タイピング譜面データの構築

`buildTypingMap()`

`mapJson` - タイムタグ付きタイピング譜面データ

`charPoint` - ローマ字換算での1打鍵あたりのポイント

```typescript
import { buildTypingMap, type MapJsonLine } from 'lyrics-typing-engine';

/**
 * @note 重要: タイムタグ付きJsonデータはtime:0から始まり、最後の歌詞は"end"にする必要があります。
 */
const mapJson: MapJsonLine[] = [
  { time: 0, lyrics: "こんにちは", word: "こんにちは" },
  { time: 3.5, lyrics: "世界", word: "せかい" },
  { time: 6.0, lyrics: "end", word: "" }
];

const builtMap = buildTypingMap({ mapJson, charPoint: 50 });

/**
 * [
 *   {
 *     time: 0,
 *     lyrics: "こんにちは",
 *     kanaWord: "こんにちは",
 *     word: [
 *       { kana: "こ", romaPatterns: ["ko", "co"], point: 100, type: "kana" },
 *       { kana: "ん", romaPatterns: ["nn", "'n", "xn"], point: 100, type: "kana" },
 *       { kana: "に", romaPatterns: ["ni"], point: 100, type: "kana" },
 *       { kana: "ち", romaPatterns: ["ti", "chi"], point: 100, type: "kana" },
 *       { kana: "は", romaPatterns: ["ha"], point: 100, type: "kana" }
 *     ],
 *     kpm: { kana: 85, roma: 154 },
 *     notes: { kana: 5, roma: 10 },
 *   },
 *   {
 *     time: 3.5,
 *     lyrics: "世界",
 *     kanaWord: "せかい",
 *     word: [
 *       { kana: "せ", romaPatterns: ["se", "ce"], point: 100, type: "kana" },
 *       { kana: "か", romaPatterns: ["ka", "ca"], point: 100, type: "kana" },
 *       { kana: "い", romaPatterns: ["i", "yi"], point: 50, type: "kana" }
 *     ],
 *     kpm: { kana: 72, roma: 120 },
 *     notes: { kana: 3, roma: 5 },
 *   },
 *   {
 *     time: 6,
 *     lyrics: "end",
 *     kanaWord: "",
 *     word: [],
 *     kpm: { kana: 0, roma: 0 },
 *     notes: { kana: 0, roma: 0 }
 *   }
 * ]
 */
```

### 入力の判定

`isTypingKey()` - onKeyDownイベント時の文字入力キー判定

`evaluateRomaTypingInput()` - onKeyDownイベント時のローマ字入力時の判定

`evaluateKanaTypingInput()` - onKeyDownイベント時のかな入力時の判定

`evaluateTypingInput()` - どこでも呼び出し可能な入力判定関数

```typescript
import { evaluateRomaTypingInput } from 'lyrics-typing-engine';

const inputMode = "roma";

document.addEventListener('keydown', (event) => {
  if (!isTypingKey(event)) return;

    const typingResult =
      inputMode === "roma" ? evaluateRomaTypingInput(event, lineWord) : evaluateKanaTypingInput(event, lineWord);

  if (typingResult.successKey) {
    // 正解時の処理
    currentLineWord = typingResult.newLineWord;
  } else if (typingResult.failKey) {
    // ミス時の処理
  }
});
```

### タイピングワードの生成

`sentenceToKanaChunkWords()` - かなチャンク変換

`generateTypingWord()` - タイピングワード生成

```typescript
import { generateTypingWord } from 'lyrics-typing-engine';

const kanaChunkWord = sentenceToKanaChunkWords("きゅっとひもをしばる");
// ["きゅ", "っと", "ひ", "も", "を", "し", "ば", "る"]

const typingWord = generateTypingWord({ kanaChunkWord, charPoint: 50 });

/**
 * [
 *   { kana: "きゅ", romaPatterns: ["kyu", "kilyu", "kixyu"], point: 150, type: "kana" },
 *   { kana: "っと", romaPatterns: ["tto", "ltutto", "xtutto", "ltsutto", "xtsutto"], point: 150, type: "kana" },
 *   { kana: "ひ", romaPatterns: ["hi"], point: 100, type: "kana" },
 *   { kana: "も", romaPatterns: ["mo"], point: 100, type: "kana" },
 *   { kana: "を", romaPatterns: ["wo"], point: 100, type: "kana" },
 *   { kana: "し", romaPatterns: ["si", "shi", "ci"], point: 100, type: "kana" },
 *   { kana: "ば", romaPatterns: ["ba"], point: 100, type: "kana" },
 *   { kana: "る", romaPatterns: ["ru"], point: 100, type: "kana" }
 * ]
 */


```

## カスタムオプション

ジェネリック型で独自のオプションを定義できます。

```typescript
interface MyOptions {
  changeCSS?: string;
  changeVideoSpeed?: number;
}

const mapJson: MapJsonLine<MyOptions>[] = [
  {
    time: 0,
    lyrics: "歌詞",
    word: "かし",
    options: { changeCSS: "color: red;" }
  }
];

const typingMap = buildTypingMap<MyOptions>(mapJson);
```

## import 可能な型

```typescript
// タイムタグ付きJsonデータ型
interface MapJsonLine<TOptions = unknown> {
  time: string | number; // 時間(ミリ秒)
  lyrics: string; // 歌詞
  word: string; // ひらがなで記述されたタイピングワード
  options?: TOptions; // オプション(カスタムオプション)
}

// ビルド済みタイピング譜面データ型
interface BuiltMapLine<TOptions = unknown> {
  time: number; // 時間(ミリ秒)
  word: TypeChunk[]; // ビルド済みタイピングワード
  lyrics: string; // 歌詞
  kpm: { kana: number; roma: number }; // フレーズの要求速度
  notes: { kana: number; roma: number }; // フレーズの要求打鍵数
  kanaWord: string; // ひらがなで記述されたタイピングワード
  options?: TOptions; // オプション(カスタムオプション)
}

// ビルド済みタイピングチャンク 型
interface TypeChunk {
  kana: string; // ひらがな
  romaPatterns: string[]; // ローマ字パターン
  point: number; // ポイント
  type: "kana" | "alphabet" | "num" | "symbol" | "space" | undefined; // タイピングチャンクの種類
}

// タイピング入力時の判定 型
interface TypingEvaluationResult {
  newLineWord: LineWord; // 更新後のタイピングワード
  successKey: string | undefined; // 正解時の入力キー
  failKey: string | undefined; // ミス時の入力キー
  charType: TypeChunk["type"]; // 入力したタイピングチャンクの種類
  isCompleted: boolean; // 打ち切り判定
  updatePoint: number; // 加算ポイント
}

// タイピングキー 型
interface TypingKey {
  key: string; // 入力キー
  code: string; // 入力コード
  shiftKey: boolean; // Shiftキーの状態
  keyCode: number; // 入力キーのコード
}

// 入力モード 型
type InputMode = "roma" | "kana";

// タイピングワード 型
interface LineWord {
  correct: { kana: string; roma: string }; // 正解したローマ字・かな
  nextChar: TypeChunk; // 次のタイピングチャンク
  word: TypeChunk[]; // 残りタイピングワード
}
```

## 汎用関数作成例

```typescript

// タイピング行のインデックスを抽出
export function extractTypingLineIndexes(lines: BuiltMapLine[]): number[] {
  const typingLineIndexes: number[] = [];

  for (const [index, line] of builtMapLines.entries()) {
    if (line.notes.roma > 0) {
      typingLineIndexes.push(index);
    }
  }

  return typingLineIndexes;
}

// 最初のタイピング行を取得
export const getStartLine = (lines: BuiltMapLine[]) => {
  if (!lines[0]) {
    throw new Error("lines is empty: cannot find start line");
  }

  for (const [index, line] of lines.entries()) {
    if (line.notes.roma > 0) {
      return { ...line, index };
    }
  }

  return { ...lines[0], index: lines.length - 1 };
};

// 速度の難易度を計算
export const calculateSpeedDifficulty = (lines: BuiltMapLine[]) => {
  const romaSpeedList = lines.map((line) => line.kpm.roma);
  const kanaSpeedList = lines.map((line) => line.kpm.kana);

  const romaMedianSpeed = medianIgnoringZeros(romaSpeedList);
  const kanaMedianSpeed = medianIgnoringZeros(kanaSpeedList);
  const romaMaxSpeed = Math.max(...romaSpeedList);
  const kanaMaxSpeed = Math.max(...kanaSpeedList);

  return {
    median: { roma: romaMedianSpeed, kana: kanaMedianSpeed },
    max: { roma: romaMaxSpeed, kana: kanaMaxSpeed },
  };
};

// 譜面の打鍵数を計算
export const calculateTotalNotes = (lines: BuiltMapLine[]) => {
  return lines.reduce(
    (acc, line) => {
      acc.kana += line.notes.kana;
      acc.roma += line.notes.roma;
      return acc;
    },
    { kana: 0, roma: 0 },
  );
};


// クリア率を計算するための1打鍵あたりのキー率とミス率を計算
export const calculateKeyAndMissRates = ({ romaTotalNotes }: { romaTotalNotes: number }) => {
  const keyRate = 100 / romaTotalNotes;
  const missRate = keyRate / 2;

  return { keyRate, missRate };
};
```

## ライセンス

MIT

## 作者

toshi7878
