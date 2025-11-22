const TYPE_CODE_SET = new Set([
  "Space",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",
  "Digit0",
  "Minus",
  "Equal",
  "IntlYen",
  "BracketLeft",
  "BracketRight",
  "Semicolon",
  "Quote",
  "Backslash",
  "Backquote",
  "IntlBackslash",
  "Comma",
  "Period",
  "Slash",
  "IntlRo",
  "Unidentified",
]);

const TYPE_TENKEY_CODE_SET = new Set([
  "Numpad1",
  "Numpad2",
  "Numpad3",
  "Numpad4",
  "Numpad5",
  "Numpad6",
  "Numpad7",
  "Numpad8",
  "Numpad9",
  "Numpad0",
  "NumpadDivide",
  "NumpadMultiply",
  "NumpadSubtract",
  "NumpadAdd",
  "NumpadDecimal",
]);

export const isTypingKey = (event: Pick<KeyboardEvent, "ctrlKey" | "altKey" | "keyCode" | "code">) => {
  if (event.ctrlKey || event.altKey) return false;
  const { keyCode, code } = event;

  const isTypeKey = (keyCode >= 65 && keyCode <= 90) || TYPE_CODE_SET.has(code) || TYPE_TENKEY_CODE_SET.has(code);
  if (!isTypeKey) return false;

  return true;
};
