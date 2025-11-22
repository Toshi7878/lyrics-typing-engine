export { buildTypingMap } from "./build-typing-map/build-map";
export { parseKanaChunks } from "./build-typing-map/parse-kana-chunks";
export { parseKanaToWordChunks } from "./build-typing-map/parse-kana-to-word-chunks";
export { isTypingKey } from "./evaluator/is-typing-key";
export type { TypingEvaluationResult, TypingKey } from "./evaluator/type";
export {
  evaluateKanaTypingInput,
  evaluateRomaTypingInput,
  evaluateTypingInput,
} from "./evaluator/typing-input-evaluator";
export type {
  BuiltMapLine,
  InputMode,
  LineWord,
  MapJsonLine,
  WordChunk,
} from "./type";
