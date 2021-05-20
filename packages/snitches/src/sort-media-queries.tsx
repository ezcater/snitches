const minMaxWidth = /(!?\(\s*min(-device-)?-width)(.|\n)+\(\s*max(-device)?-width/i;
const minWidth = /\(\s*min(-device)?-width/i;
const maxMinWidth = /(!?\(\s*max(-device)?-width)(.|\n)+\(\s*min(-device)?-width/i;
const maxWidth = /\(\s*max(-device)?-width/i;

const isMinWidth = _testQuery(minMaxWidth, maxMinWidth, minWidth);
const isMaxWidth = _testQuery(maxMinWidth, minMaxWidth, maxWidth);

const minMaxHeight = /(!?\(\s*min(-device)?-height)(.|\n)+\(\s*max(-device)?-height/i;
const minHeight = /\(\s*min(-device)?-height/i;
const maxMinHeight = /(!?\(\s*max(-device)?-height)(.|\n)+\(\s*min(-device)?-height/i;
const maxHeight = /\(\s*max(-device)?-height/i;

const isMinHeight = _testQuery(minMaxHeight, maxMinHeight, minHeight);
const isMaxHeight = _testQuery(maxMinHeight, minMaxHeight, maxHeight);

const maxValue = Number.MAX_VALUE;

function _testQuery(doubleTestTrue: RegExp, doubleTestFalse: RegExp, singleTest: RegExp) {
  return (query: string) => {
    if (doubleTestTrue.test(query)) return true;
    return doubleTestFalse.test(query) ? false : singleTest.test(query);
  };
}

const unitMultiplier: Record<string, number> = {ch: 8.8984375, em: 16, rem: 16, ex: 8.296875};

/**
 * Obtain the length of the media request in pixels.
 * Uses fixed font size values to derive relative value for ch/ex/em/rem.
 * @private
 * @param {string} length
 * @return {number}
 */
function _getQueryLength(length: string): number {
  const matches = /(-?\d*\.?\d+)(ch|em|ex|px|rem)/.exec(length);

  if (!matches) return maxValue;

  const [number, unit] = matches;

  return parseFloat(number) * (unitMultiplier[unit] || 1);
}

/**
 * Sorting an array with media queries
 * according to the mobile-first methodology.
 * @param {string} a
 * @param {string} b
 * @return {number} 1 / 0 / -1
 */
function sortCSSmq(a: string, b: string): number {
  const minA = isMinWidth(a) || isMinHeight(a);
  const maxA = isMaxWidth(a) || isMaxHeight(a);

  const minB = isMinWidth(b) || isMinHeight(b);
  const maxB = isMaxWidth(b) || isMaxHeight(b);

  if (minA && maxB) return -1;
  if (maxA && minB) return 1;

  let lengthA = _getQueryLength(a);
  let lengthB = _getQueryLength(b);

  if (lengthA === maxValue && lengthB === maxValue) return a.localeCompare(b);
  if (lengthA === maxValue) return 1;
  if (lengthB === maxValue) return -1;
  if (lengthA > lengthB) return maxA ? -1 : 1;
  if (lengthA < lengthB) return maxA ? 1 : -1;

  return a.localeCompare(b);
}

export const sortCssMediaQueries = (a: string, b: string): number =>
  a === '' ? -1 : b === '' ? 1 : a === 'all' ? -1 : b === 'all' ? 1 : sortCSSmq(a, b);

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
