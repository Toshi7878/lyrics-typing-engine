export type InputMode = "roma" | "kana" | "flick";

export interface MapJsonLine<TOptions = unknown> {
  time: string | number;
  lyrics: string;
  word: string;
  options?: TOptions;
}

export interface WordChunk {
  kana: string;
  romaPatterns: string[];
  point: number;
  type: "kana" | "alphabet" | "num" | "symbol" | "space" | undefined;
  kanaUnSupportedSymbol?: string;
}

export interface LineWord {
  correct: { kana: string; roma: string };
  nextChunk: WordChunk & { orginalDakuChar?: Dakuten | HanDakuten };
  wordChunks: WordChunk[];
}

export interface BuiltMapLine<TOptions = unknown> {
  time: number;
  duration: number;
  wordChunks: WordChunk[];
  lyrics: string;
  kpm: { kana: number; roma: number };
  notes: { kana: number; roma: number };
  kanaLyrics: string;
  romaLyrics: string;
  options?: TOptions;
}

export type Dakuten =
  | "ゔ"
  | "が"
  | "ぎ"
  | "ぐ"
  | "げ"
  | "ご"
  | "ざ"
  | "じ"
  | "ず"
  | "ぜ"
  | "ぞ"
  | "だ"
  | "ぢ"
  | "づ"
  | "で"
  | "ど"
  | "ば"
  | "び"
  | "ぶ"
  | "べ"
  | "ぼ";

export type NormalizeHirakana =
  | "う"
  | "か"
  | "き"
  | "く"
  | "け"
  | "こ"
  | "さ"
  | "し"
  | "す"
  | "せ"
  | "そ"
  | "た"
  | "ち"
  | "つ"
  | "て"
  | "と"
  | "は"
  | "ひ"
  | "ふ"
  | "へ"
  | "ほ";

export type HanDakuten = "ぱ" | "ぴ" | "ぷ" | "ぺ" | "ぽ";
