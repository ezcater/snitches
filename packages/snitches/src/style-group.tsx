import React, {createContext, useContext, useRef} from 'react';
import Style from './style-tag';
import {isNodeEnvironment} from './is-node';

/**
 * Cache to hold already used styles.
 * React Context on the server - singleton object on the client.
 */
const Cache: any = isNodeEnvironment() ? createContext(false) : false;

/**
* Hook using the cache created on the server or client.
*/
const useCache = (): boolean => {
  if (isNodeEnvironment()) {
    // On the server we use React Context to we don't leak the cache between SSR calls.
    // During runtime this hook isn't conditionally called - it is at build time that the flow gets decided.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useContext(Cache);
  }

  // On the client we use the object singleton.
  return Cache;
};

/**
* On the server this ensures the minimal amount of styles will be rendered
* safely using React Context.
*
* On the browser this turns into a fragment with no React Context.
*/
const StyleCacheProvider = ({value, children}: {value: boolean, children: React.ReactNode}) => {
  if (isNodeEnvironment()) {
    return <Cache.Provider value={value}>{children}</Cache.Provider>;
  }

  return children as JSX.Element;
};

/**
 * Aggregates styles into groups to be to the head of the application during runtime, or inline within components for server-render.
 *
 * @param ruleset TStyleSheet
 */
const StyleGroup = ({children = null, ruleset}: any) => {
  const cached = useCache();
  
  if (isNodeEnvironment() && !cached) ruleset.reset();
  
  const ref = useRef('');

  // update the ref if it's changed since the last render
  // note this isn't in a useEffect, since that doesn't run on the server
  ref.current += ruleset.toString();

  const {current: styles} = ref;

  // remove styles already inserted into the page
  if (isNodeEnvironment()) prune(ruleset.sheet.rules); 

  return (
    <StyleCacheProvider value={true}>
      <Style ruleset={styles} />
      {children}
    </StyleCacheProvider>
  );
};

const prune = (current: Rules) => {
  const groupNames: RuleGroupNames = ['themed', 'global', 'styled', 'onevar', 'allvar', 'inline'];

  groupNames.forEach(groupName => {
    const {group} = current[groupName];
    // when SSR, cssRules is a simple array (and can be cleared)
    (group.cssRules as any).length = 0;
  });
};

// types from https://github.com/modulz/stitches/blob/676eac2c37f50ec1598c4daba3cfcb35dca92287/packages/core/src/createSheet.d.ts
type SheetGroup = {
  sheet: CSSStyleSheet;
  rules: {
    themed: RuleGroup;
    global: RuleGroup;
    styled: RuleGroup;
    onevar: RuleGroup;
    allvar: RuleGroup;
    inline: RuleGroup;
  };

  reset(): void;
  toString(): string;
};

type RuleGroup = {
  index: number;
  group: CSSGroupingRule;
  cache: Set<string>;

  apply(cssText: string): void;
};

type Rules = SheetGroup['rules'];
type RuleGroupNames = (keyof Rules)[];

export default StyleGroup;
