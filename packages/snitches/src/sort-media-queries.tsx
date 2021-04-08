import sortFn from 'sort-css-media-queries';

export const sortCssMediaQueries = (a: string, b: string) =>
  a === '' ? -1 : b === '' ? 1 : a === 'all' ? -1 : b === 'all' ? 1 : sortFn(a, b);

export const sortCssRules = (rules: string[]): string[] => {
  const rulesWithIndex = rules.map((r, i) => [r, i] as [string, number]);

  rulesWithIndex.sort(([aRule, aIndex], [bRule, bIndex]) => {
    if (aRule.charCodeAt(0) !== 64 && bRule.charCodeAt(0) !== 64) return aIndex - bIndex;

    if (bRule.charCodeAt(0) !== 64) return 1;
    if (aRule.charCodeAt(0) !== 64) return -1;

    return sortCssMediaQueries(aRule, bRule);
  });

  return rulesWithIndex.map(([rule]) => rule);
};
