export { buildTypingMap } from "./build-typing-map/build-map";
export { parseKanaChunks } from "./build-typing-map/parse-kana-chunks";
export { parseKanaToWordChunks } from "./build-typing-map/parse-kana-to-word-chunks";
export { createTypingWord } from "./create-typing-word/create-typing-word";
export { isTypingKey } from "./evaluator/is-typing-key";
export type { TypingEvaluationResult, TypingKey } from "./evaluator/type";
export {
  evaluateKanaInput,
  evaluateRomaInput,
  evaluateTypingInput,
} from "./evaluator/typing-input-evaluator";
export type {
  BuiltMapLine,
  InputMode,
  MapJsonLine,
  TypingWord as TypingWordState,
  WordChunk,
} from "./type";
