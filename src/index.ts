export { buildTypingMap } from "./build-typing-map/build-map";
export { parseWordToChunks } from "./build-typing-map/parse-word-to-chunks";
export { createDisplayWord } from "./create-typing-word/create-display-word";
export { createTypingWord } from "./create-typing-word/create-typing-word";
export { isTypingKey } from "./evaluator/is-typing-key";
export type { TypingInputResult } from "./evaluator/type";
export {
  evaluateKanaInput,
  evaluateRomaInput,
  executeTypingInput,
} from "./evaluator/typing-input-evaluator";
export type {
  BuiltMapLine,
  InputMode,
  RawMapLine,
  TypingWord,
  WordChunk,
} from "./type";
