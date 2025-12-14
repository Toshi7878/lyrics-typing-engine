export { buildTypingMap } from "./build-typing-map/build-map";
export {
  createDisplayWord,
  replaceAllSpaceWithLowMacron,
  replaceAllSpaceWithThreePerEmSpace,
} from "./create-typing-word/create-display-word";
export { createTypingWord } from "./create-typing-word/create-typing-word";
export { recreateTypingWord } from "./create-typing-word/recreate-typing-word";

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
