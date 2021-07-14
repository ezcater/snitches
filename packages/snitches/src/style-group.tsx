import React, {createContext, useContext, useRef} from 'react';

/**
 * Returns `true` when inside a server environment else `false`.
 *
 * This method works by checking for access to a global Document object.
 */
 function isServerEnvironment(): boolean {
  return typeof document === 'undefined';
};

/**
 * Cache to hold already used styles.
 * React Context on the server - singleton object on the client.
 */
const Cache: any = isServerEnvironment() ? createContext(false) : false;

/**
* Hook using the cache created on the server or client.
*/
function useCache(): boolean {
  if (isServerEnvironment()) {
    // On the server we use React Context to we don't leak the cache between SSR calls.
    // During runtime this hook isn't conditionally called - it is at build time that the flow gets decided.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useContext(Cache);
  }

  // On the client we use the object singleton.
  return Cache;
};

function getCssString(ruleset: any) {
  const groupSheet = ruleset.sheet;
  const {cssRules} = groupSheet.sheet;
  return Array.from(cssRules as CSSMediaRule[]).map((cssRule: CSSMediaRule, cssRuleIndex) => {
    const { cssText } = cssRule;

    let lastRuleCssText = '';

    if (cssText.startsWith('--stitches')) return '';

    if (cssRules[cssRuleIndex - 1] && (lastRuleCssText = cssRules[cssRuleIndex - 1].cssText).startsWith('--stitches')) {
      if (!cssRule.cssRules.length) return '';

      for (const name in groupSheet.rules) {
        if (groupSheet.rules[name].group === cssRule) {
          return `--stitches{--:${Array.from(groupSheet.rules[name].cache).join(' ')}}${cssText}`;
        }
      }

      return cssRule.cssRules.length ? `${lastRuleCssText}${cssText}` : '';
    }

    return cssText;
  })
  .join('');
}

/**
 * Aggregates styles into groups to be to the head of the application during runtime, or inline within components for server-render.
 *
 * @param ruleset TStyleSheet
 */
const StyleGroup = ({children = null, ruleset}: any) => {
  const cached = useCache();
  const ref = useRef<string>();

  // sometimes node envs (like JEST) will use reactDOM.render
  // instead of renderToString/stream etc in order to test interactions
  // in that setup, we should only "server render" styles in the first response
  // we'll then inject styles into the document head
  const isFirstRender = ref.current === undefined;
  const isSSR = isFirstRender && isServerEnvironment();

  if (isSSR) {
    if (!cached) ruleset.reset();
    ref.current = getCssString(ruleset);
  }
  else return children || null;

  // remove styles already inserted into the page
  prune(ruleset.sheet.rules); 

  return (
    <Cache.Provider value={true}>
      {ref.current ? <style data-snitches-ssr dangerouslySetInnerHTML={{__html: ref.current}} /> : null}
      {children}
    </Cache.Provider>
  );
};

const prune = (current: any) => {
  const groupNames = ['themed', 'global', 'styled', 'onevar', 'allvar', 'inline'];

  groupNames.forEach(groupName => {
    const {group} = current[groupName];
    // when SSR, cssRules is a simple array (and can be cleared)
    group.cssRules.length = 0;
  });
};

export default StyleGroup;
