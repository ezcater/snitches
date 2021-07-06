/**
 * Decomposes a css ruleset into declaration blocks.
 */
export const blocks = (style: string): string[] => {
  let opened = 0;
  let closed = 0;
  return style
    .trim()
    .toString()
    // can't use /(?<=\})(?!})/ as we need to support IE.
    .split(/([^}]*\})(?!})/g).filter(x => x)
    .reduce((prev, next) => {
      if (opened === closed) prev.push(next);
      else prev[prev.length - 1] += next;

      opened += (next.match(/{/g) || []).length;
      closed += (next.match(/}/g) || []).length;

      return prev;
    }, [] as any);
};
