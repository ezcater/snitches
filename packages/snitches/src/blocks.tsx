/**
 * Decomposes a css ruleset into declaration blocks.
 */
export const blocks = (style: string): string[] => {
  return style.toString().split(/(?<=\})(?!})/);
};
