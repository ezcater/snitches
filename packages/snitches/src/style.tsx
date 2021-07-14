import React, {useRef} from 'react';
import insertRule from './sheet';
import {StyleSheetOpts} from './types';
import {isNodeEnvironment} from './is-node';

interface StyleProps extends StyleSheetOpts {
  /**
   * CSS Rules.
   * Ensure each rule is a separate element in the array.
   */
  children: string;
}

function Style(props: StyleProps) {
  const ref = useRef<string>('');

  // update the ref if it's changed since the last render
  // note this isn't in a useEffect, since that doesn't run on the server
  ref.current += props.children.toString();
  
  const {current: sheets} = ref;

  if (sheets) {
    if (isNodeEnvironment()) {
      return (
        <style
          data-s-ssr
          nonce={props.nonce}
          dangerouslySetInnerHTML={{__html: sheets}}
        />
      );
    }
    insertRule(sheets, props);
  }

  return null;
}

export default Style;
