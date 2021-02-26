import React, {ReactNode} from 'react';
import {default as CC} from './style-cache';
import {default as CS} from './style';
import {blocks} from './blocks';

interface StyleTagProps {
  children?: ReactNode;
  /**
   * CSS Rules to either server render or inject into the page
   */
  ruleset?: string;
}

/**
 * Aggregates styles to the head of the application during runtime or inline within components for server-render.
 *
 * @param css string
 * @param opts StyleSheetOpts
 */
const StyleTag: React.FC<StyleTagProps> = (props) => {
  return (
    <CC>
      <CS>{blocks(props.ruleset || '')}</CS>
      <>{props.children}</>
    </CC>
  );
};

export default StyleTag;
