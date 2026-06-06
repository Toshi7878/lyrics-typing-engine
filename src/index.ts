export { buildTypingMap } from "./build-typing-map/build-map.js";
export { CODE_TO_KANA, KEY_TO_KANA } from "./evaluator/const.js";
export {
  createDisplayWord,
  replaceAllSpaceWithLowMacron,
  replaceAllSpaceWithThreePerEmSpace,
} from "./create-typing-word/create-display-word.js";
export { createTypingWord } from "./create-typing-word/create-typing-word.js";
export { recreateTypingWord } from "./create-typing-word/recreate-typing-word.js";
export { handleTyping } from "./evaluator/handle-typing.js";
export { isTypingKey } from "./evaluator/is-typing-key.js";
export type { TypingInputResult } from "./evaluator/type.js";
export {
  evaluateKanaInput,
  evaluateRomaInput,
  executeTypingInput,
} from "./evaluator/typing-input-evaluator.js";
export type {
  BuiltMapLine,
  InputMode,
  RawMapLine,
  TypingWord,
  WordChunk,
} from "./type.js";
