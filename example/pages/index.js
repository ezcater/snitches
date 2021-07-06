import Head from 'next/head';
import Snitches from '@ezcater/snitches';
import stitches from '../stitches.config';
import {useState} from 'react';

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

  variants: {
    size: {
      1: {
        fontSize: '13px',
        height: '25px',
      },
      2: {
        fontSize: '15px',
        height: '35px',
      },
    },
    variant: {
      gray: {
        backgroundColor: '$gray400',
        '&:hover': {
          backgroundColor: '$gray500',
        },
      },
      primary: {
        backgroundColor: '$primary',
        color: 'white',
        '&:hover': {
          backgroundColor: '$primaryDark',
        },
      },
    },
    outlined: {
      true: {
        $$shadowColor: 'transparent',
        backgroundColor: 'transparent',
        boxShadow: '0 0 0 1px $$shadowColor',
      },
    },
  },

  defaultVariants: {
    variant: 'gray',
    size: 1,
  },

  compoundVariants: [
    {
      variant: 'gray',
      outlined: true,
      css: {
        $$shadowColor: '$colors$gray400',
      },
    },
    {
      variant: 'primary',
      outlined: true,
      css: {
        $$shadowColor: '$colors$primary',
        color: '$primary',
        '&:hover': {
          color: 'white',
        },
      },
    },
  ],
});

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <Snitches ruleset={stitches}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={box({css: {textAlign: 'center'}})}>{count}</div>
      <div
        className={box({
          css: {margin: '$2', display: 'flex', flexWrap: 'wrap', gap: '$2'},
        })}
      >
        <button className={button()} onClick={() => setCount(count + 1)}>
          Button
        </button>
        <button className={button({variant: 'gray'})}>Gray Button</button>
        <button className={button({variant: 'primary'})}>Primary Button</button>
        <button className={button({variant: 'gray', outlined: true})}>Outlined Gray Button</button>
        <button className={button({variant: 'primary', outlined: true})}>
          Outlined Primary Button
        </button>
        <button
          className={button({
            variant: 'primary',
            outlined: true,
            size: {'@initial': '2', '@bp1': '1'},
          })}
        >
          Responsive Primary Button
        </button>
      </div>
    </Snitches>
  );
}
