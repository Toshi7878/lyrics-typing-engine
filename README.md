# lyrics-typing-engine

音楽に同期したタイピングゲーム用のエンジンライブラリ。歌詞データからタイピングマップを生成し、ローマ字入力・かな入力の判定を行います。

**前提:** キー入力はブラウザの `KeyboardEvent` を想定しています。パッケージは ESM（`"type": "module"`）として公開されています。

**リポジトリ:** [github.com/Toshi7878/lyrics-typing-engine](https://github.com/Toshi7878/lyrics-typing-engine)

## 目次

- [インストール](#インストール)
- [処理の流れ（概要）](#処理の流れ概要)
- [機能](#機能)
  - [タイピング譜面データの構築](#タイピング譜面データの構築)
  - [歌詞フレーズ切り替わり時のタイピングワード更新](#歌詞フレーズ切り替わり時のタイピングワード更新)
  - [入力の判定](#入力の判定)
  - [`handleTyping`（コールバック形式）](#handletypingコールバック形式)
  - [リプレイ再生用の入力判定関数](#リプレイ再生用の入力判定関数)
  - [表示用タイピングワードの生成](#表示用タイピングワードの生成)
  - [タイピングワード再生成](#タイピングワード再生成)
- [カスタムオプション](#カスタムオプション)
- [import 可能な型](#import-可能な型)
- [ライセンス](#ライセンス)
- [作者](#作者)

## インストール

```bash
npm install lyrics-typing-engine
```

## 処理の流れ（概要）

1. `buildTypingMap()` で譜面（`BuiltMapLine[]`）を生成する  
2. 再生位置に合わせて `createTypingWord()` で現在フレーズの `TypingWord` を作る  
3. `keydown` などで `evaluateRomaInput` / `evaluateKanaInput`（または `handleTyping` / `executeTypingInput`）で状態を更新する  
4. UI には `createDisplayWord()` の戻り値を使う  

## 機能

### タイピング譜面データの構築

`buildTypingMap()`

- `rawMapLines` — ビルド前のタイピング譜面データ
- `charPoint` — ローマ字換算での 1 打鍵あたりのポイント

各行の `time` は **秒**（再生タイムラインと同じ単位の数値）です。`string` も渡せますが、内部で `Number()` 化されます。

```typescript
import { buildTypingMap, type RawMapLine } from 'lyrics-typing-engine';

/**
 * @note 重要: タイピング譜面データは time: 0 から始まり、最後の歌詞は "end" にする必要があります。
 */
const rawMapLines: RawMapLine[] = [
  { time: 0, lyrics: "こんにちは", word: "こんにちは" },
  { time: 3.5, lyrics: "世界", word: "せかい" },
  { time: 6.0, lyrics: "end", word: "" },
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

`createTypingWord(builtMapLine: BuiltMapLine, correct?: { kana: string; roma: string })` — `builtMapLines` の行から次のフレーズのタイピングワードを作成します。

`correct` — 正解したローマ字・かな（デフォルトは空文字列）

```typescript
import { createTypingWord } from 'lyrics-typing-engine';

// builtMapLines は buildTypingMap の戻り値とする
let lineIndex = 0;

const timer = () => {
  const currentTime = video.getCurrentTime();
  const nextLine = builtMapLines[lineIndex + 1];

  if (nextLine && currentTime >= nextLine.time) {
    lineIndex++;
    const newTypingWord = createTypingWord(builtMapLines[lineIndex]);
    console.log(newTypingWord);
  }
};

/**
 * {
 *   correct: { kana: "", roma: "" },
 *   nextChunk: { kana: "こ", romaPatterns: ["ko", "co"], point: 100, type: "kana" },
 *   wordChunks: [
 *     { kana: "こ", romaPatterns: ["ko", "co"], point: 100, type: "kana" },
 *     { kana: "ん", romaPatterns: ["nn", "'n", "xn"], point: 100, type: "kana" },
 *     { kana: "に", romaPatterns: ["ni"], point: 100, type: "kana" },
 *     { kana: "ち", romaPatterns: ["ti", "chi"], point: 100, type: "kana" },
 *     { kana: "は", romaPatterns: ["ha"], point: 100, type: "kana" }
 *   ],
 *   wordChunksIndex: 1,
 * }
 */
```

### 入力の判定

`isTypingKey(event: KeyboardEvent)` — イベント時の文字入力キー判定

`evaluateRomaInput({ event, typingWord, isCaseSensitive? })` — ローマ字入力時の判定

`evaluateKanaInput({ event, typingWord, isCaseSensitive? })` — かな入力時の判定

`isCaseSensitive` — 大文字小文字を区別するかどうか（デフォルトは `false`）

```typescript
import { isTypingKey, evaluateRomaInput, evaluateKanaInput } from 'lyrics-typing-engine';

const inputMode = "roma";

document.addEventListener('keydown', (event) => {
  if (!isTypingKey(event)) return;
  const typingWord = readTypingWord();

  const typingResult =
    inputMode === "roma"
      ? evaluateRomaInput({ event, typingWord })
      : evaluateKanaInput({ event, typingWord });

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
 *       { kana: "こ", romaPatterns: ["ko", "co"], point: 100, type: "kana" },
 *       { kana: "ん", romaPatterns: ["nn", "'n", "xn"], point: 100, type: "kana" },
 *       { kana: "に", romaPatterns: ["ni"], point: 100, type: "kana" },
 *       { kana: "ち", romaPatterns: ["ti", "chi"], point: 100, type: "kana" },
 *       { kana: "は", romaPatterns: ["ha"], point: 100, type: "kana" }
 *     ],
 *     wordChunksIndex: 2
 *   },
 *   successKey: "o",
 *   failKey: undefined,
 *   chunkType: "kana",
 *   isCompleted: false,
 *   updatePoint: 100
 * }
 */
```

### `handleTyping`（コールバック形式）

`evaluateRomaInput` / `evaluateKanaInput` をラップし、成功・ワード完了・ミスをコールバックで受け取れます。`onSuccess` の戻り値の型をジェネリックに渡せます（`isCompleted` 時に `onCompleted` へ引き渡されます）。

`inputMode` が `"roma"` 以外（`"kana"` / `"flick"`）のときはかな側の評価になります。

```typescript
import { handleTyping, isTypingKey } from 'lyrics-typing-engine';

document.addEventListener('keydown', (event) => {
  if (!isTypingKey(event)) return;

  handleTyping(
    { event, inputMode: 'roma', typingWord },
    {
      onSuccess: ({ nextTypingWord, successKey, isCompleted, updatePoint, chunkType }) => {
        // UI 更新・スコア加算など
        return { nextTypingWord };
      },
      onCompleted: (payload) => {
        // 1 ワード入力完了時（onSuccess の戻り値が渡る）
      },
      onMiss: ({ failKey }) => {
        // ミス時
      },
    },
  );
});
```

### リプレイ再生用の入力判定関数

`executeTypingInput({ inputChar, inputMode, typingWord, isCaseSensitive? })`

`isCaseSensitive` — 大文字小文字を区別するかどうか（デフォルトは `false`）

`inputMode` が `"roma"` 以外のときはかな入力として扱われます。

```typescript
import { executeTypingInput } from 'lyrics-typing-engine';

const replayData = [
  {
    startInputMode: 'roma' as const,
    typeResults: [
      { time: 0, char: 'c', isSuccess: true },
      { time: 1, char: 'o', isSuccess: true },
      { time: 2, char: 'a', isSuccess: false },
    ],
  },
];

const typeResults = replayData[0].typeResults;
const inputMode = replayData[0].startInputMode;
const typingResult = executeTypingInput({
  inputChar: typeResults[0].char,
  inputMode,
  typingWord,
});
console.log(typingResult);

/**
 * {
 *   nextTypingWord: {
 *     correct: { kana: "", roma: "c" },
 *     nextChunk: { kana: "こ", romaPatterns: ["o"], point: 100, type: "kana" },
 *     wordChunks: [
 *       { kana: "こ", romaPatterns: ["ko", "co"], point: 100, type: "kana" },
 *       { kana: "ん", romaPatterns: ["nn", "'n", "xn"], point: 100, type: "kana" },
 *       { kana: "に", romaPatterns: ["ni"], point: 100, type: "kana" },
 *       { kana: "ち", romaPatterns: ["ti", "chi"], point: 100, type: "kana" },
 *       { kana: "は", romaPatterns: ["ha"], point: 100, type: "kana" },
 *     ],
 *     wordChunksIndex: 1
 *   },
 *   successKey: "c",
 *   failKey: undefined,
 *   chunkType: "kana",
 *   isCompleted: false,
 *   updatePoint: 0
 * }
 */
```

### 表示用タイピングワードの生成

`createDisplayWord(typingWord: TypingWord, options?: { remainWord: { maxLength: number } })` — タイピングワードから表示用の状態を生成します。

- `typingWord` — 現在のタイピングワード
- `options.remainWord.maxLength` — 未入力部分の表示文字数上限

入力済みのスペースは `ˍ` (U+02CD) に置換されます。未入力の半角スペースは ` ` (U+2004) に置換されます。

同ファイルから `replaceAllSpaceWithLowMacron` / `replaceAllSpaceWithThreePerEmSpace` も export されています。

```typescript
import { createDisplayWord } from 'lyrics-typing-engine';

const displayState = createDisplayWord(typingWord, { remainWord: { maxLength: 20 } });
console.log(displayState);
/**
 * {
 *   correct: { kana: "こ", roma: "co" },
 *   nextChar: { kana: "ん", roma: "nn" },
 *   remainWord: { kana: "にちは", roma: "nitiha" }
 * }
 *
 * // nextChar.roma は nextChunk.romaPatterns の最初のパターンが表示されます
 */
```

### タイピングワード再生成

かな入力 → ローマ字入力の動的なモード切り替え時に使用します。

`recreateTypingWord(typingWord: TypingWord)` — タイピングワードを再生成します。

```typescript
import { recreateTypingWord } from 'lyrics-typing-engine';

const newTypingWord = recreateTypingWord(currentTypingWord);
```

## カスタムオプション

ジェネリック型で独自のオプションを定義できます。

```typescript
import { buildTypingMap, type RawMapLine } from 'lyrics-typing-engine';

interface MyOptions {
  changeCSS?: string;
  changeVideoSpeed?: number;
}

const rawMapLines: RawMapLine<MyOptions>[] = [
  {
    time: 0,
    lyrics: "歌詞",
    word: "かし",
    options: { changeCSS: "color: red;" },
  },
];

const builtMapLines = buildTypingMap<MyOptions>({ rawMapLines, charPoint: 0 });
```

## import 可能な型

パッケージに含まれる `dist/*.d.ts` が正本です。以下は主要フィールドの要約です。

```typescript
// ビルド前タイピング譜面データ型
interface RawMapLine<TOptions = unknown> {
  time: string | number; // 行の開始時刻（秒。再生位置と同じ単位）
  lyrics: string; // 歌詞
  word: string; // ひらがなで記述されたタイピングワード
  options?: TOptions; // オプション（カスタムオプション）
}

// ビルド済みタイピング譜面データ型
interface BuiltMapLine<TOptions = unknown> {
  time: number; // 行の開始時刻（秒）
  duration: number; // 行の長さ（秒）— 次の行の time との差分
  wordChunks: WordChunk[]; // ビルド済みタイピングワード
  lyrics: string; // 歌詞
  kpm: { kana: number; roma: number }; // フレーズの要求速度
  notes: { kana: number; roma: number }; // フレーズの要求打鍵数
  kanaLyrics: string; // かな表記の歌詞
  romaLyrics: string; // ローマ字表記の歌詞（各 chunk の最初のパターン）
  options?: TOptions; // オプション（カスタムオプション）
}

// ビルド済みタイピングチャンク型
interface WordChunk {
  kana: string; // ひらがな
  romaPatterns: string[]; // ローマ字パターン
  point: number; // ポイント
  type: "kana" | "alphabet" | "num" | "symbol" | "space" | undefined; // タイピングチャンクの種類
  kanaUnSupportedSymbol?: string;
}

// タイピングモード型
type InputMode = "roma" | "kana" | "flick";

// タイピングワード型（nextChunk は WordChunk に濁点まわりの拡張が付く場合があります）
interface TypingWord {
  correct: { kana: string; roma: string }; // 正解したローマ字・かな
  nextChunk: WordChunk; // 次のタイピングチャンク
  wordChunks: WordChunk[]; // 全タイピングワード
  wordChunksIndex: number; // 現在の wordChunks の位置
  tempRomaPatterns?: string[]; // 一時的なローマ字パターン
}

// タイピング入力時の判定型
interface TypingInputResult {
  nextTypingWord: TypingWord; // 更新後のタイピングワード（ミス時は実質更新されません）
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
