# lyrics-typing-engine

音楽に同期したタイピングゲーム用のエンジンライブラリ。歌詞データからタイピングマップを生成し、ローマ字入力・かな入力の評価を行います。

## インストール

```bash
npm install lyrics-typing-engine
```

または

```bash
pnpm install lyrics-typing-engine
```

## 主要機能

- **タイピングマップの生成**: 歌詞と時間情報からタイピング用のデータ構造を自動生成
- **入力評価**: ローマ字入力・かな入力の正誤判定とリアルタイム評価
- **TypeScript完全対応**: 型安全な開発が可能
- **カスタムオプション**: ジェネリック型による柔軟なオプション設定

## 基本的な使い方

### 1. タイピングマップの生成

```typescript
import { buildTypingMap, type MapJsonLine, type BuiltMapLine } from 'lyrics-typing-engine';

// 入力データ（歌詞と時間情報）
const mapJson: MapJsonLine[] = [
  {
    time: 0,
    lyrics: "こんにちは",
    word: "こんにちは",
  },
  {
    time: 3.5,
    lyrics: "世界",
    word: "せかい",
  },
  {
    time: 6.0,
    lyrics: "end",
    word: "",
  }
];

// タイピングマップを生成
const typingMap: BuiltMapLine[] = buildTypingMap(mapJson);

console.log(typingMap[0]);
// {
//   time: 0,
//   lyrics: "こんにちは",
//   kanaWord: "こんにちは",
//   word: [...], // TypeChunk配列
//   kpm: { kana: 120, roma: 180 },
//   notes: { kana: 5, roma: 10 },
//   lineCount: 1
// }
```

### 2. タイピング入力の評価

```typescript
import { evaluateRomaTypingInput, type LineWord } from 'lyrics-typing-engine';

// 現在のタイピング状態（typingMapから取得）
let currentLineWord: LineWord = typingMap[0].word;

// キーボードイベントを評価
document.addEventListener('keydown', (event) => {
  const result = evaluateRomaTypingInput(event, currentLineWord);

  if (result.successKey) {
    console.log('正解:', result.successKey);
    // 状態を更新
    currentLineWord = result.newLineWord;

    // ポイント加算
    if (result.updatePoint > 0) {
      addScore(result.updatePoint);
    }

    // 行が完了したか確認
    if (result.isCompleted) {
      console.log('行完了！');
      // 次の行へ進む
    }
  } else if (result.failKey) {
    console.log('ミス:', result.failKey);
  }
});
```

### 3. かな入力の評価

```typescript
import { evaluateKanaTypingInput } from 'lyrics-typing-engine';

document.addEventListener('keydown', (event) => {
  const result = evaluateKanaTypingInput(event, currentLineWord);
  // 処理はローマ字入力と同様
});
```

### 4. 入力モードの動的切り替え

```typescript
import { evaluateTypingInput, type InputMode, type TypingKey } from 'lyrics-typing-engine';

let inputMode: InputMode = 'roma'; // 'roma' | 'kana' | 'flick'

document.addEventListener('keydown', (event) => {
  // キー情報を構造化
  const typingKey: TypingKey = {
    keys: [event.key],
    key: event.key,
    code: event.code,
    shift: event.shiftKey
  };

  const result = evaluateTypingInput(typingKey, inputMode, currentLineWord);
  // 評価結果を処理
});
```

## カスタムオプションの使用

`options` フィールドに独自の型を指定できます。

```typescript
import { buildTypingMap, type MapJsonLine, type BuiltMapLine } from 'lyrics-typing-engine';

// カスタムオプション型を定義
interface MyGameOptions {
  changeCSS?: string;        // CSS変更用
  eternalCSS?: string;       // 永続CSS用
  isChangeCSS?: boolean;     // CSS変更フラグ
  changeVideoSpeed?: number; // 動画速度変更
  difficulty?: 'easy' | 'normal' | 'hard';
}

// 型を指定して使用
const mapJson: MapJsonLine<MyGameOptions>[] = [
  {
    time: 0,
    lyrics: "イントロ",
    word: "",
    options: {
      changeVideoSpeed: 0.8,
      difficulty: 'easy'
    }
  },
  {
    time: 5.2,
    lyrics: "高速パート",
    word: "こうそくぱーと",
    options: {
      changeCSS: "color: red;",
      difficulty: 'hard',
      changeVideoSpeed: 1.2
    }
  }
];

// buildTypingMapにも型パラメータを渡す
const typingMap: BuiltMapLine<MyGameOptions>[] = buildTypingMap<MyGameOptions>(mapJson);

// options が型安全にアクセスできる
if (typingMap[1].options?.difficulty === 'hard') {
  console.log('高難易度モード');
}
```

## 高度な使用例

### 文字ごとのポイント設定

```typescript
// 2番目の引数でポイント倍率を指定（デフォルト: 0）
const typingMap = buildTypingMap(mapJson, 10);
// 各文字に10ポイントが設定されます
```

### かなチャンクへの変換のみ

```typescript
import { sentenceToKanaChunkWords } from 'lyrics-typing-engine';

const sentence = "こんにちは\n世界";
const kanaChunks = sentenceToKanaChunkWords(sentence);
// [["こ", "ん", "に", "ち", "は"], ["せ", "か", "い"]]
```

### タイピングワードの生成

```typescript
import { generateTypingWord, type TypeChunk } from 'lyrics-typing-engine';

const kanaChunks = ["こ", "ん", "に", "ち", "は"];
const typeChunks: TypeChunk[] = generateTypingWord(kanaChunks, 10);

console.log(typeChunks[0]);
// {
//   kana: "こ",
//   romaPatterns: ["ko", "co"],
//   point: 10,
//   type: "kana"
// }
```

## API リファレンス

### buildTypingMap

```typescript
function buildTypingMap<TOptions = unknown>(
  mapJson: MapJsonLine<TOptions>[],
  charPoint?: number
): BuiltMapLine<TOptions>[]
```

歌詞データからタイピングマップを生成します。

**パラメータ:**
- `mapJson`: 時間と歌詞情報を含む配列
- `charPoint`: 1文字あたりのポイント（デフォルト: 0）

**戻り値:**
- タイピングに必要な全情報を含む `BuiltMapLine` 配列

### evaluateRomaTypingInput

```typescript
function evaluateRomaTypingInput(
  event: Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "keyCode">,
  lineWord: LineWord
): TypingEvaluationResult
```

ローマ字入力を評価します。

### evaluateKanaTypingInput

```typescript
function evaluateKanaTypingInput(
  event: Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "keyCode">,
  lineWord: LineWord
): TypingEvaluationResult
```

かな入力を評価します。

### evaluateTypingInput

```typescript
function evaluateTypingInput(
  typingKeys: TypingKey,
  inputMode: InputMode,
  lineWord: LineWord
): TypingEvaluationResult
```

入力モードに応じて入力を評価します。

## 型定義

### MapJsonLine

```typescript
interface MapJsonLine<TOptions = unknown> {
  time: string | number;  // 歌詞が表示される時間（秒）
  lyrics: string;         // 表示する歌詞
  word: string;          // タイピング対象のかな文字列
  options?: TOptions;     // カスタムオプション
}
```

### BuiltMapLine

```typescript
interface BuiltMapLine<TOptions = unknown> {
  time: number;                              // 開始時間
  word: TypeChunk[];                        // タイピング用文字配列
  lyrics: string;                            // 歌詞
  kpm: { kana: number; roma: number };      // 1分あたりの打鍵数
  notes: { kana: number; roma: number };    // 総打鍵数
  lineCount?: number;                        // 行番号
  kanaWord: string;                          // かな文字列
  options?: TOptions;                        // カスタムオプション
}
```

### TypeChunk

```typescript
interface TypeChunk {
  kana: string;                    // かな文字
  romaPatterns: string[];          // 入力可能なローマ字パターン
  point: number;                   // ポイント
  type: "kana" | "alphabet" | "num" | "symbol" | "space" | undefined;
  kanaUnSupportedSymbol?: string;  // かな入力非対応記号
}
```

### TypingEvaluationResult

```typescript
interface TypingEvaluationResult {
  newLineWord: LineWord;           // 更新後の状態
  successKey: string | undefined;  // 成功したキー
  failKey: string | undefined;     // 失敗したキー
  charType: TypeChunk["type"];     // 文字タイプ
  isCompleted: boolean;            // 行完了フラグ
  updatePoint: number;             // 獲得ポイント
}
```

### InputMode

```typescript
type InputMode = "roma" | "kana" | "flick";
```

## ライセンス

MIT

## 作者

toshi7878

