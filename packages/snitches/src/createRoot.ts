type RuleGroup = {
	index: number
	group: CSSGroupingRule
	cache: Set<string>

	apply(cssText: string): void
}

type SheetGroup = {
	sheet: CSSStyleSheet
	rules: {
		themed: RuleGroup
		global: RuleGroup
		styled: RuleGroup
		onevar: RuleGroup
		allvar: RuleGroup
		inline: RuleGroup
	}

	reset(): void
	toString(): string
}

type Rules = SheetGroup['rules'];
type GroupName = keyof Rules;
type RuleGroupNames = GroupName[];

const names: RuleGroupNames = ['themed', 'global', 'styled', 'onevar', 'allvar', 'inline'];

type DocumentRoot = {
  head: HTMLHeadElement,
  styleSheets: StyleSheetList,
};

const createRoot = () : DocumentRoot => {

  // we need to create and potentially hydrate a "sheet"
  // a sheet allows the browser to insert styles into the right place in the document
  // allowing for styles to be in ordered groups to ensure the styles cascade in a predictable way

  // this code allows us to both support IE (which doesn't allow style insertion via `insertRule` while using CSS vars)
  // and allows us to support server rendering

  const root = typeof document !== 'undefined' ? document : undefined;

  const sheet = createSheet(root);

  hydrate(sheet, root);

  // return custom root in order to control `insertRule` 
  return {
    head: root?.head,
    get styleSheets() {
      return [sheet];
    },
    // avoid serializing when stitches calls createMemo.
    toJSON() {
      return {};
    }
  } as any;
};

const supportsCSSVars = (
  typeof window !== 'undefined'
  && 'CSS' in window
  && 'supports' in window.CSS
  && CSS.supports('color', 'var(--css-var)')
);


// CSSRule types: https://developer.mozilla.org/en-US/docs/Web/API/CSSRule/type
const types = {
  undefined: 1,
  import: 3,
  media: 4,
  font: 5,
  page: 6,
  keyframes: 7,
  keyframe: 8,
  reserved: 9,
  namespace: 10,
  'counter-style': 11,
  supports: 12,
};
type Types = keyof typeof types;

function getRuleType (cssText: string): number {
  const rule: string = (cssText.toLowerCase().match(/^@([a-z]+)/) || [])[1];
  return types[rule as Types];
}

function createSheet(root?: Document): CSSStyleSheet {
  const mediaSheets: HTMLStyleElement[] = [];
  let ownerNode: HTMLStyleElement | undefined;

  if (root) {
    ownerNode = (root.head || root).appendChild(document.createElement('style'));
  }

  // tag the style element so we know it was inserted by snitches
  if (ownerNode) ownerNode.dataset.snitches = '';

  // if running in the browser AND the browser supports CSS vars, we can use a single stylesheet and insertRule
  // and fall back in stitches default style insertion logic
  // otherwise we need to use a custom sheet to insert styles with appendChild
  const sheet = ownerNode?.sheet && supportsCSSVars ? ownerNode.sheet : {
    type: 'text/css',
    cssRules: [],
    // this is a workaround for the fact that stitches doesn't actually call deleteRule to remove styles
    // but it DOES check to see if `deleteRule` exists before deleting rules...
    get deleteRule() {
      // accessing this method triggers the removal of all snitches inserted style tags
      this.cssRules = [];

      mediaSheets.forEach(sheet => {
        if (document.contains(sheet)) sheet.parentElement?.removeChild(sheet);
      });

      // empty out reference to the removed sheets
      mediaSheets.length = 0;
      
      return () => {};
    },
    insertRule(cssText: string, index: number = 0): number {
      let tag: HTMLStyleElement | undefined;
      
      if (getRuleType(cssText) === 4 && ownerNode) {
        tag = document.createElement('style');
      
        // tag the style element so we know it was inserted by snitches
        if (tag) tag.dataset.snitches = '';

        // insert the styles into the tag
        tag.appendChild(document.createTextNode(cssText));
    
        // insert the media stylesheet immediately following the "parent" stylesheet
        ownerNode?.parentNode?.insertBefore(tag, mediaSheets[index]);

        mediaSheets.splice(index, 0, tag);
      }

      (this.cssRules as any as CSSRule[])
        .splice(
          index, 
          0, 
          createCSSMediaRule(cssText, tag)
        );
      
      return index;
    },
    ownerNode,
  };

  // ensure that stitches hydration runs (so that we can guarantee our `insertRule` logic is used for SSR)
  Array.from(Array(6).keys()).forEach((group) => {
    const index = sheet.cssRules.length;
    sheet.insertRule('@media{}', index);
    sheet.insertRule("--stitches { --:" + group + "; }", index);
  });

  return sheet as any;
}

function createCSSMediaRule(sourceCssText: string, tag?: HTMLStyleElement): CSSMediaRule {
  return ({
    type: getRuleType(sourceCssText),
    cssRules: [],
    insertRule(cssText: string, index: number) {
      // this is recursive... but i'm not sure it needs to be?
      this.cssRules.splice(index, 0, createCSSMediaRule(cssText, tag));

      // insert the styles into the tag
      tag?.appendChild(document.createTextNode(cssText));
    },
    get cssText() {
      return sourceCssText === '@media{}' ? `@media{${toCss(this.cssRules)}}` : sourceCssText;
    },
  }) as any
}

function toCss(cssRules: CSSRuleList): string {
  return Array.from(cssRules).map((cssRule) => cssRule.cssText).join('');
}

function hydrate(groupSheet: CSSStyleSheet, ownerNode?: Document) {
  const sheets = Array
    // all the stylesheets on the page
    .from(Object(ownerNode).styleSheets as StyleSheetList || [])
    // filter to only the set tagged as being server rendered by snitches
    .filter(sheet => (sheet.ownerNode as HTMLStyleElement)?.dataset.snitchesSsr)

  // iterate all stylesheets until a hydratable stylesheet is found
  for (const sheet of sheets) {
    if (sheet.href && !sheet.href.startsWith(location.origin)) continue;

    let inserted = false;

    for (let index = 0, rules = sheet.cssRules; rules[index]; ++index) {
      /** Possible indicator rule. */
      const check: CSSStyleRule = Object(rules[index]);

      // a hydratable set of rules will start with a style rule (type: 1), ignore all others
      if (check.type !== 1) continue;

      /** Possible styling group. */
      const group: CSSMediaRule = Object(rules[index + 1]);

      // a hydratable set of rules will follow with a media rule (type: 4), ignore all others
      if (group.type !== 4) continue;

      ++index;

      const { cssText } = check;

      // a hydratable style rule will have a selector of `--stitches`, ignore all others
      if (!cssText.startsWith('--stitches')) continue;

      const cache = cssText.slice(16, -3).trim().split(/\s+/);

      const groupNumber = cache[0] as any;

      const groupName: GroupName | undefined = names[groupNumber];

      // a hydratable style rule will have a parsable group, ignore all others
      if (!groupName) continue;

      const sheetIndex = (groupNumber * 2) + 1;

      const mediaSheet = groupSheet.cssRules[sheetIndex] as CSSMediaRule | undefined;

      if (mediaSheet?.insertRule) {
        mediaSheet?.insertRule(group.cssText, mediaSheet.cssRules.length);
        inserted = true;
      }
    }

    if (inserted && sheet.ownerNode) {
      // remove the stylesheet to avoid react hydration warnings
      sheet.ownerNode.parentElement?.removeChild(sheet.ownerNode);
    }
  }
}

export default createRoot;
