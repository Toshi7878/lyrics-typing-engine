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
 *       { kana: "い", romaPatterns: ["i"], point: 50, type: "kana" }
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

### タイピングワードの初期状態の作成

`createWordState(mapLine: BuiltMapLine)` - タイピングワードの初期状態の作成

```typescript
import { createWordState } from 'lyrics-typing-engine';

const count = 0;

const timer = () => {
  const currentTime = video.getCurrentTime();
  const nextLine = builtMap[count + 1]

  if (currentTime >= nextLine.time) {
    count++;
    const newWordState = createWordState(nextLine);
    setWordState(newWordState);
  }

}

/**
 * {
 *   correct: { kana: "", roma: "" },
 *   nextChunk: { kana: "こ", romaPatterns: ["ko", "co"], point: 100, type: "kana" },
 *   wordChunks: [{ kana: "ん", romaPatterns: ["nn", "'n", "xn"], point: 100, type: "kana" }, { kana: "に", romaPatterns: ["ni"], point: 100, type: "kana" }, { kana: "ち", romaPatterns: ["ti", "chi"], point: 100, type: "kana" }, { kana: "は", romaPatterns: ["ha"], point: 100, type: "kana" } ]
 * }
 */
```

### 入力の判定

`isTypingKey(event: KeyboardEvent)` - イベント時の文字入力キー判定

`evaluateRomaInput(event: KeyboardEvent, wordState: TypingWordState)` - ローマ字入力時の判定

`evaluateKanaInput(event: KeyboardEvent, wordState: TypingWordState)` - かな入力時の判定

`evaluateTypingInput(typingKeys: TypingKey, inputMode: InputMode, wordState: TypingWordState)` - どこでも呼び出し可能な入力判定関数 (リプレイなどで使用可能)

```typescript
import { buildTypingMap, createWordState, evaluateRomaInput, evaluateKanaInput } from 'lyrics-typing-engine';

const builtMap = buildTypingMap({ mapJson, charPoint: 50 });
const inputMode = "roma";

// 各行の初期状態を作成
let currentWordState = createWordState(builtMap[0]);

document.addEventListener('keydown', (event) => {
  if (!isTypingKey(event)) return;

    const typingResult =
      inputMode === "roma" ? evaluateRomaInput(event, currentWordState) : evaluateKanaInput(event, currentWordState);

  if (typingResult.successKey) {
    // 正解時の処理
    currentWordState = typingResult.nextWordState;
  } else if (typingResult.failKey) {
    // ミス時の処理
  }
});
```

### タイピングワードの生成

`parseKanaChunks()` - かなチャンク変換

`parseKanaToWordChunks()` - タイピングローマ字チャンク生成

```typescript
import { parseKanaToWordChunks } from 'lyrics-typing-engine';

const kanaChunks = parseKanaChunks("きゅっとひもをしばる");
// ["きゅ", "っと", "ひ", "も", "を", "し", "ば", "る"]

const wordChunks = parseKanaToWordChunks({ kanaChunks, charPoint: 50 });

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

const builtMap = buildTypingMap<MyOptions>({ mapJson, charPoint: 0 });
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

// タイピング入力時の判定 型
interface TypingEvaluationResult {
  nextWordState: TypingWordState; // 更新後のタイピングワード (ミス時は実質更新されません)
  successKey: string | undefined; // 正解時の入力キー
  failKey: string | undefined; // ミス時の入力キー
  charType: WordChunk["type"]; // 入力したタイピングチャンクの種類
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

// タイピングモード 型
type InputMode = "roma" | "kana";

// タイピングワード 型
interface TypingWordState {
  correct: { kana: string; roma: string }; // 正解したローマ字・かな
  nextChunk: WordChunk; // 次のタイピングチャンク
  wordChunks: WordChunk[]; // 残りタイピングワード
}



```

## ライセンス

MIT

## 作者

toshi7878
