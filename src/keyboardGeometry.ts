// Keep a little context above the input (usually its label), and a gap below it.
// Tall multiline inputs align at the top and retain their own internal scrolling.
export function keyboardScrollOffset({
  offset,
  viewportTop,
  viewportHeight,
  inputTop,
  inputHeight,
  keyboardTop,
}: {
  offset: number;
  viewportTop: number;
  viewportHeight: number;
  inputTop: number;
  inputHeight: number;
  keyboardTop?: number;
}): number {
  const top = viewportTop + 32;
  const bottom = Math.min(viewportTop + viewportHeight, keyboardTop ?? Infinity) - 20;
  if (bottom <= top) return offset;
  const visibleHeight = bottom - top;
  if (inputTop < top || inputHeight > visibleHeight) return Math.max(0, offset + inputTop - top);
  if (inputTop + inputHeight > bottom) return Math.max(0, offset + inputTop + inputHeight - bottom);
  return offset;
}
