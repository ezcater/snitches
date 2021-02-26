# @ezcater/snitches

![Image from the movie Matilda, saying "snitches get stitches"](https://media.giphy.com/media/hM5au6CO46lP2/giphy.gif)

Looking for "zero config SRR" for [your css-in-js library](https://stitches.dev/)? With Snitches, consumers of your components don't have to do anything to make it work. Just import, wrap and go!

Snitches aggregates styles to the head of the application during runtime or inlines styles within your components for server-render.

## Installation

```bash
npm i @ezcater/snitches
```

## Usage

```jsx
import Snitches from '@ezcater/snitches';
import stitches from '../stitches.config';

const {css} = stitches;

const box = css({});

const button = css({
  // mini reset
  appearance: 'none',
  border: 'none',
  backgroundColor: 'transparent',
  lineHeight: 1,
  borderRadius: '99999px',
  px: '$1',
});

export default function Home() {
  return (
    <Snitches ruleset={stitches}>
      <div className={box({css: {margin: '$2', display: 'flex', flexWrap: 'wrap', gap: '$2'}})}>
        <button className={button()}>Button</button>
      </div>
    </Snitches>
  );
}
```
