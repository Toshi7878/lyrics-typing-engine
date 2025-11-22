export { buildTypingMap } from "./build-typing-map/build-map";
export { generateTypingWord } from "./build-typing-map/generate-typing-word";
export { sentenceToKanaChunkWords } from "./build-typing-map/sentence-to-kana-chunk-words";
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
  TypeChunk,
} from "./type";
