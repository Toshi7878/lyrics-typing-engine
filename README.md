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

// タイピングモード 型
type InputMode = "roma" | "kana";

// タイピングワード 型
interface LineWord {
  correct: { kana: string; roma: string }; // 正解したローマ字・かな
  nextChar: TypeChunk; // 次のタイピングチャンク
  word: TypeChunk[]; // 残りタイピングワード
}



```

## ライセンス

MIT

## 作者

toshi7878
