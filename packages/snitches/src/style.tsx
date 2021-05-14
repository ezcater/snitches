import React from 'react';
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
  const {current: sheets} = React.useRef<string[]>([]);

  if (props.children.length) {
    if (isNodeEnvironment()) {
      for (let i = 0; i < props.children.length; i++) {
        const sheet = props.children[i];
        if (inserted[sheet]) {
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
        <style
          data-s-ssr
          nonce={props.nonce}
          dangerouslySetInnerHTML={{__html: sortCssRules(sheets).join('')}}
        />
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

export default Style;
