import {StyleSheetOpts} from './types';

/**
 * Adds a `<style>` tag to the `<head>`.
 */
function addStyleTagToHead(opts: StyleSheetOpts): HTMLStyleElement {
  const tag = document.createElement('style');
  opts.nonce && tag.setAttribute('nonce', opts.nonce);
  tag.appendChild(document.createTextNode(''));
  document.head.appendChild(tag);

  return tag;
}

/**
 * Used to move styles to the head of the application during runtime.
 *
 * @param css string
 * @param opts StyleSheetOpts
 */
export default function insertRule(css: string, opts: StyleSheetOpts) {
  const style = addStyleTagToHead(opts);

  if (process.env.NODE_ENV === 'production') {
    const sheet = style.sheet as CSSStyleSheet;
    sheet.insertRule(css, sheet.cssRules.length);
  } else {
    style.appendChild(document.createTextNode(css));
  }
}
