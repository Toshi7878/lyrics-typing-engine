export const isAlphabet = (key: string): boolean => {
  if (key.length !== 1) return false;
  return (key >= "a" && key <= "z") || (key >= "A" && key <= "Z");
};
