# lyrics-typing-engine

音楽に同期したタイピングゲーム用のエンジンライブラリ。歌詞データからタイピングマップを生成し、ローマ字入力・かな入力の判定を行います。

## インストール

```bash
npm install lyrics-typing-engine
```

## 機能

### タイピング譜面データの構築

`buildTypingMap()`

`rawMapLines` - ビルド前のタイピング譜面データ

`charPoint` - ローマ字換算での1打鍵あたりのポイント

```typescript
import { buildTypingMap, type RawMapLine } from 'lyrics-typing-engine';

/**
 * @note 重要: タイピング譜面データはtime:0から始まり、最後の歌詞は"end"にする必要があります。
 */
const rawMapLines: RawMapLine[] = [
  { time: 0, lyrics: "こんにちは", word: "こんにちは" },
  { time: 3.5, lyrics: "世界", word: "せかい" },
  { time: 6.0, lyrics: "end", word: "" }
];

const builtMapLines = buildTypingMap({ rawMapLines, charPoint: 50 });

console.log(builtMapLines);
/**
 * [
 *   {
 *     time: 0,
 *     duration: 3.5,
 *     lyrics: "こんにちは",
 *     kanaLyrics: "こんにちは",
 *     romaLyrics: "konnitiha",
 *     wordChunks: [
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
 *     duration: 2.5,
 *     lyrics: "世界",
 *     kanaLyrics: "せかい",
 *     romaLyrics: "sekai",
 *     wordChunks: [
 *       { kana: "せ", romaPatterns: ["se", "ce"], point: 100, type: "kana" },
 *       { kana: "か", romaPatterns: ["ka", "ca"], point: 100, type: "kana" },
 *       { kana: "い", romaPatterns: ["i", "yi"], point: 50, type: "kana" }
 *     ],
 *     kpm: { kana: 72, roma: 120 },
 *     notes: { kana: 3, roma: 5 },
 *   },
 *   {
 *     time: 6,
 *     duration: 0,
 *     lyrics: "end",
 *     kanaLyrics: "",
 *     romaLyrics: "",
 *     wordChunks: [],
 *     kpm: { kana: 0, roma: 0 },
 *     notes: { kana: 0, roma: 0 }
 *   }
 * ]
 */
```

### 歌詞フレーズ切り替わり時のタイピングワード更新

`createTypingWord(builtMapLine: BuiltMapLine)` - builtMapLinesの行から次のフレーズのタイピングワードを作成

```typescript
import { createTypingWord } from 'lyrics-typing-engine';

const count = 0;

const timer = () => {
  const currentTime = video.getCurrentTime();
  const nextLine = builtMapLines[count + 1];

  if (currentTime >= nextLine.time) {
    count++;
    const newTypingWord = createTypingWord(nextLine);
    console.log(newTypingWord);
  }

}

/**
 * {
 *   correct: { kana: "", roma: "" },
 *   nextChunk: { kana: "こ", romaPatterns: ["ko", "co"], point: 100, type: "kana" },
 *   wordChunks: [
 *     { kana: "ん", romaPatterns: ["nn", "'n", "xn"], point: 100, type: "kana" },
 *     { kana: "に", romaPatterns: ["ni"], point: 100, type: "kana" },
 *     { kana: "ち", romaPatterns: ["ti", "chi"], point: 100, type: "kana" },
 *     { kana: "は", romaPatterns: ["ha"], point: 100, type: "kana" }
 *   ]
 * }
 */
```

### 入力の判定

`isTypingKey(event: KeyboardEvent)` - イベント時の文字入力キー判定

`evaluateRomaInput(event: KeyboardEvent, typingWord: TypingWord)` - ローマ字入力時の判定

`evaluateKanaInput(event: KeyboardEvent, typingWord: TypingWord)` - かな入力時の判定

```typescript
import { isTypingKey, evaluateRomaInput, evaluateKanaInput } from 'lyrics-typing-engine';

const inputMode = "roma";

document.addEventListener('keydown', (event) => {
  if (!isTypingKey(event)) return;
  const typingWord = readTypingWord();

    const typingResult =
      inputMode === "roma" ? evaluateRomaInput(event, typingWord) : evaluateKanaInput(event, typingWord);

  if (typingResult.successKey) {
    // 正解時の処理
    console.log(typingResult);
  } else if (typingResult.failKey) {
    // ミス時の処理
  }
});

/**
 * {
 *   nextTypingWord: {
 *     correct: { kana: "こ", roma: "co" },
 *     nextChunk: { kana: "ん", romaPatterns: ["nn", "'n", "xn"], point: 100, type: "kana" },
 *     wordChunks: [
 *       { kana: "に", romaPatterns: ["ni"], point: 100, type: "kana" },
 *       { kana: "ち", romaPatterns: ["ti", "chi"], point: 100, type: "kana" },
 *       { kana: "は", romaPatterns: ["ha"], point: 100, type: "kana" }
 *     ]
 *   },
 *   successKey: "o",
 *   failKey: undefined,
 *   chunkType: "kana",
 *   isCompleted: false,
 *   updatePoint: 100
 * }
 */
```

### リプレイ再生用の入力判定関数

`executeTypingInput(inputChar: string, inputMode: InputMode, typingWord: TypingWord)`

```typescript
import { executeTypingInput } from 'lyrics-typing-engine';

const replayData = [
  startInputMode: "roma",
  typeResults: [
    { time: 0, inputChar: "c", }
    { time: 1, inputChar: "o", }
    { time: 2, inputChar: "n", }
  ]
];

const typeResults = replayData[0].typeResults;
const inputMode = replayData[0].startInputMode;
const typingResult = executeTypingInput(typeResults[0].inputChar, inputMode, typingWord);
console.log(typingResult);

/**
 * {
 *   nextTypingWord: {
 *     correct: { kana: "", roma: "c" },
 *     nextChunk: { kana: "こ", romaPatterns: ["o"], point: 100, type: "kana" },
 *     wordChunks: [
 *       { kana: "ん", romaPatterns: ["nn", "'n", "xn"], point: 100, type: "kana" },
 *       { kana: "に", romaPatterns: ["ni"], point: 100, type: "kana" },
 *       { kana: "ち", romaPatterns: ["ti", "chi"], point: 100, type: "kana" },
 *       { kana: "は", romaPatterns: ["ha"], point: 100, type: "kana" },
 *     ]
 *   },
 *   successKey: "c",
 *   failKey: undefined,
 *   chunkType: "kana",
 *   isCompleted: false,
 *   updatePoint: 0
 * }
 */

```

### 文字列からタイピングワードの生成

`parseWordToChunks(word: string, charPoint: number)` - 文字列からタイピングワードを生成

タイピング中の入力モード切り替え機能などで活用できます

```typescript
import { parseWordToChunks } from 'lyrics-typing-engine';

const wordChunks = parseWordToChunks({ word: "きゅっとひもをしばる", charPoint: 50 });

console.log(createTypingWord({ wordChunks }));
/**
 * {
 *   correct: { kana: "", roma: "" },
 *   nextChunk: { kana: "きゅ", romaPatterns: ["kyu", "kilyu", "kixyu"], point: 150, type: "kana" },
 *   wordChunks: [
 *     { kana: "っと", romaPatterns: ["tto", "ltutto", "xtutto", "ltsutto", "xtsutto"], point: 150, type: "kana" },
 *     { kana: "ひ", romaPatterns: ["hi"], point: 100, type: "kana" },
 *     { kana: "も", romaPatterns: ["mo"], point: 100, type: "kana" },
 *     { kana: "を", romaPatterns: ["wo"], point: 100, type: "kana" },
 *     { kana: "し", romaPatterns: ["si", "shi", "ci"], point: 100, type: "kana" },
 *     { kana: "ば", romaPatterns: ["ba"], point: 100, type: "kana" },
 *     { kana: "る", romaPatterns: ["ru"], point: 100, type: "kana" }
 *   ]
 * }
 */

```

## カスタムオプション

ジェネリック型で独自のオプションを定義できます。

```typescript
interface MyOptions {
  changeCSS?: string;
  changeVideoSpeed?: number;
}

const rawMapLines: RawMapLine<MyOptions>[] = [
  {
    time: 0,
    lyrics: "歌詞",
    word: "かし",
    options: { changeCSS: "color: red;" }
  }
];

const builtMapLines = buildTypingMap<MyOptions>({ rawMapLines, charPoint: 0 });
```

## import 可能な型

```typescript
// ビルド前タイピング譜面データ型
interface RawMapLine<TOptions = unknown> {
  time: string | number; // 時間(ミリ秒)
  lyrics: string; // 歌詞
  word: string; // ひらがなで記述されたタイピングワード
  options?: TOptions; // オプション(カスタムオプション)
}

// ビルド済みタイピング譜面データ型
interface BuiltMapLine<TOptions = unknown> {
  time: number; // 時間(ミリ秒)
  duration: number; // 行の時間の長さ(秒) - 次の行のtimeとの差分
  wordChunks: WordChunk[]; // ビルド済みタイピングワード
  lyrics: string; // 歌詞
  kpm: { kana: number; roma: number }; // フレーズの要求速度
  notes: { kana: number; roma: number }; // フレーズの要求打鍵数
  kanaLyrics: string; // かな表記の歌詞
  romaLyrics: string; // ローマ字表記の歌詞(各chunkの最初のパターン)
  options?: TOptions; // オプション(カスタムオプション)
}

// ビルド済みタイピングチャンク 型
interface WordChunk {
  kana: string; // ひらがな
  romaPatterns: string[]; // ローマ字パターン
  point: number; // ポイント
  type: "kana" | "alphabet" | "num" | "symbol" | "space" | undefined; // タイピングチャンクの種類
}

// タイピングモード 型
type InputMode = "roma" | "kana";

// タイピングワード 型
interface TypingWord {
  correct: { kana: string; roma: string }; // 正解したローマ字・かな
  nextChunk: WordChunk; // 次のタイピングチャンク
  wordChunks: WordChunk[]; // 残りタイピングワード
}

// タイピング入力時の判定 型
interface TypingResult {
  nextTypingWord: TypingWord; // 更新後のタイピングワード (ミス時は実質更新されません)
  successKey: string | undefined; // 正解時の入力キー
  failKey: string | undefined; // ミス時の入力キー
  chunkType: WordChunk["type"]; // 入力したタイピングチャンクの種類
  isCompleted: boolean; // 打ち切り判定
  updatePoint: number; // 加算ポイント
}





```

## ライセンス

MIT

## 作者

toshi7878
