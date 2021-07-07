import React, {createContext, useContext, useRef} from 'react';
import Style from './style-tag';
import {isNodeEnvironment} from './is-node';

/**
 * Cache to hold already used styles.
 * React Context on the server - singleton object on the client.
 */
const Cache: any = isNodeEnvironment() ? createContext<Rules | undefined>(undefined) : {};

/**
 * Hook using the cache created on the server or client.
 */
const useCache = (): Partial<Rules> => {
  if (isNodeEnvironment()) {
    // On the server we use React Context to we don't leak the cache between SSR calls.
    // During runtime this hook isn't conditionally called - it is at build time that the flow gets decided.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useContext(Cache) || {};
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
const StyleCacheProvider = ({value, children}: {value: Partial<Rules>, children: React.ReactNode}) => {
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
  const current = toRulesCache(ruleset.sheet.rules);
  const newRules = useRef([] as string[]);

  return (
    <StyleCacheProvider value={cached}>
      <Style ruleset={filter(newRules.current, current, cached)} />
      {children}
    </StyleCacheProvider>
  );
};

const toRulesCache = (rules: Rules): Rules => {
  return Object.entries(rules).reduce(
    (res, [key, value]) => ({
      ...res,
      [key]: {
        // unfortunately, stitches internal cache doesn't map keys 1:1 with individual css rules
        // which means we can't simply reuse their existing cache to check whether a rule currently exists
        // in the cache
        cache: new Set(Array.from(value.group.cssRules).map(rule => toHash(rule.cssText))),
        group: value.group,
      },
    }),
    {...rules}
  );
};

const filter = (newRules: string[], current: Rules, cached: Partial<Rules>) => {
  const groupNames: RuleGroupNames = ['themed', 'global', 'styled', 'onevar', 'allvar', 'inline'];

  groupNames.forEach(groupName => {
    const {group, cache, index, apply} = current[groupName];

    if (!cached[groupName]) cached[groupName] = {cache: new Set(), group, index, apply};

    const cachedGroup = cached[groupName]!.cache;

    const difference = new Set(Array.from(cache).filter(x => !cachedGroup.has(x)));

    // cache match
    if (!difference.size) return;

    // cache mismatch
    Array.from(cache).forEach((key, index) => {
      if (cachedGroup.has(key)) return;
      newRules.push(group.cssRules[index].cssText);
      cachedGroup.add(key);
    });
  });

  return {
    toString() {
      return newRules.length ? newRules.join('') : '';
    },
  };
};

const toAlphabeticChar = (code: number) => String.fromCharCode(code + (code > 25 ? 39 : 97));

const toAlphabeticName = (code: number) => {
  let name = '';
  let x;

  for (x = Math.abs(code); x > 52; x = (x / 52) | 0) name = toAlphabeticChar(x % 52) + name;

  return toAlphabeticChar(x % 52) + name;
};

const toPhash = (h: number, x: string) => {
  /* eslint-disable no-param-reassign */
  let i = x.length;
  while (i) h = (h * 33) ^ x.charCodeAt(--i);
  return h;
};

const toHash = (value: any) => toAlphabeticName(toPhash(5381, JSON.stringify(value)) >>> 0);

export default StyleGroup;


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

type RuleGroupNames = ['themed', 'global', 'styled', 'onevar', 'allvar', 'inline'];

type Rules = SheetGroup['rules'];
