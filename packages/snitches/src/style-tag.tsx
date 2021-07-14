import React, {ReactNode} from 'react';
import {default as CS} from './style';
import {isNodeEnvironment} from './is-node';

interface Sheet {
  toString(): string;
}

interface StyleTagProps {
  children?: ReactNode;
  /**
   * CSS Rules to either server render or inject into the page
   */
  ruleset?: Sheet | string;
}

if (!isNodeEnvironment()) {
  /**
   * Iterates through all found style elements generated when server side rendering
   */
  const ssrStyles = document.querySelectorAll<HTMLStyleElement>('style[data-s-ssr]');
  for (let i = 0; i < ssrStyles.length; i++) {
    // Move all found server-side rendered style elements to the head before React hydration happens.
    document.head.appendChild(ssrStyles[i]);
  }
}

/**
 * Aggregates styles to the head of the application during runtime or inline within components for server-render.
 *
 * @param css string
 * @param opts StyleSheetOpts
 */
const StyleTag: React.FC<StyleTagProps> = (props) => {
  const styles = props.ruleset?.toString();
  return (
    <>
      <CS>{styles || ''}</CS>
      <>{props.children}</>
    </>
  );
};

export default StyleTag;
