import {StyleSheetOpts} from './types';
import {blocks} from './blocks';

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

const isIE11 = typeof window !== `undefined` && !!window.MSInputMethodContext;

/**
 * Used to move styles to the head of the application during runtime.
 *
 * @param css string
 * @param opts StyleSheetOpts
 */
export default function insertRule(css: string, opts: StyleSheetOpts = {}) {
  const style = addStyleTagToHead(opts);

  if (process.env.NODE_ENV === 'production' && !isIE11) {
    const sheet = style.sheet as CSSStyleSheet;
    // media query may have contained multiple rules, so iterate over each before inserting
    blocks(css).forEach(style => sheet.insertRule(style, sheet.cssRules.length));
  } else {
    style.appendChild(document.createTextNode(css));
  }
}
