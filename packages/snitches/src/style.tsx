import React, {memo} from 'react';
import insertRule from './sheet';
import {StyleSheetOpts} from './types';
import {useCache} from './style-cache';
import {isNodeEnvironment} from './is-node';
import {sortCssRules} from './sort-media-queries';

interface StyleProps extends StyleSheetOpts {
  /**
   * CSS Rules.
   * Ensure each rule is a separate element in the array.
   */
  children: string[];
}

function Style(props: StyleProps) {
  const inserted = useCache();

  if (props.children.length) {
    if (isNodeEnvironment()) {
      let sheets = [];

      for (let i = 0; i < props.children.length; i++) {
        const sheet = props.children[i];
        // if cached and not a media query
        if (inserted[sheet] && sheet.charCodeAt(0) !== 64) {
          continue;
        } else {
          inserted[sheet] = true;
          sheets.push(sheet);
        }
      }

      if (!sheets.length) {
        return null;
      }

      return (
        <style data-s-ssr nonce={props.nonce}>
          {sortCssRules(sheets).join('')}
        </style>
      );
    } else {
      for (let i = 0; i < props.children.length; i++) {
        const sheet = props.children[i];
        if (inserted[sheet]) {
          continue;
        }

        inserted[sheet] = true;
        insertRule(sheet, props);
      }
    }
  }

  return null;
}

export default memo(Style, () => true);
