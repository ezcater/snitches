import React, {memo} from 'react';
import insertRule from './sheet';
import {StyleSheetOpts} from './types';
import {useCache} from './style-cache';
import {isNodeEnvironment} from './is-node';

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
      let hasSheets = false;

      for (let i = 0; i < props.children.length; i++) {
        const sheet = props.children[i];
        if (inserted[sheet]) {
          continue;
        } else {
          inserted[sheet] = true;
          hasSheets = true;
        }
      }

      if (!hasSheets) {
        return null;
      }

      return (
        <style data-s-ssr nonce={props.nonce}>
          {props.children.join('')}
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
