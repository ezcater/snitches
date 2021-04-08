import {sortCssMediaQueries} from './sort-media-queries';
import {StyleSheetOpts} from './types';

/**
 * Ordered style buckets using the media in which the style should apply to.
 */
const styleBucketOrdering: string[] = [];

/**
 * Holds all style buckets in memory that have been added to the head.
 */
const styleBucketsInHead: Partial<Record<string, HTMLStyleElement>> = {};

/**
 * Lazily adds a `<style>` bucket to the `<head>`.
 * This will ensure that the style buckets are ordered by media query.
 *
 * @param bucket Bucket to insert in the head
 */
function lazyAddStyleBucketToHead(bucketName: string, opts: StyleSheetOpts): HTMLStyleElement {
  if (!styleBucketsInHead[bucketName]) {
    // make sure the bucket is inserted into the document in the correct position relative to the other buckets
    styleBucketOrdering.push(bucketName);
    styleBucketOrdering.sort(sortCssMediaQueries);

    let currentBucketIndex = styleBucketOrdering.indexOf(bucketName) + 1;
    let nextBucketFromCache = null;

    // Find the next bucket which we will add our new style bucket before.
    for (; currentBucketIndex < styleBucketOrdering.length; currentBucketIndex++) {
      const nextBucket = styleBucketsInHead[styleBucketOrdering[currentBucketIndex]];
      if (nextBucket) {
        nextBucketFromCache = nextBucket;
        break;
      }
    }

    const tag = document.createElement('style');
    opts.nonce && tag.setAttribute('nonce', opts.nonce);
    bucketName && tag.setAttribute('media', bucketName);
    tag.appendChild(document.createTextNode(''));
    styleBucketsInHead[bucketName] = tag;
    document.head.insertBefore(tag, nextBucketFromCache);
  }

  return styleBucketsInHead[bucketName]!;
}

/**
 * Gets the bucket depending on the sheet.
 * This function makes assumptions as to the form of the input class name.
 *
 * Input:
 *
 * ```
 * "@media (min-width: 600px) {._a1234567:hover{ color: red; }}"
 * ```
 *
 * Output:
 *
 * ```
 * "@media (min-width: 600px)"
 * ```
 *
 * @param sheet styles for which we are getting the bucket
 */
const getStyleBucketName = (sheet: string): string => {
  // extract between `@media` and `{`
  return sheet.match(/@media\s?(.*?)\s?{/)?.[1] || '';
};

/**
 * Used to move styles to the head of the application during runtime.
 *
 * @param css string
 * @param opts StyleSheetOpts
 */
export default function insertRule(css: string, opts: StyleSheetOpts = {}) {
  const bucketName = getStyleBucketName(css);
  const style = lazyAddStyleBucketToHead(bucketName, opts);

  if (bucketName) {
    // remove the media query, since it is now on the attr tag
    css = css.substring(css.indexOf('{') + 1, css.lastIndexOf('}'));
  }

  if (process.env.NODE_ENV === 'production') {
    const sheet = style.sheet as CSSStyleSheet;
    sheet.insertRule(css, sheet.cssRules.length);
  } else {
    style.appendChild(document.createTextNode(css));
  }
}
