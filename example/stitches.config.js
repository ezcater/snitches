import {createCss} from '@stitches/core';

export default createCss({
  theme: {
    colors: {
      gray400: 'gainsboro',
      gray500: 'lightgray',
      purple400: 'blueviolet',
      purple500: 'darkviolet',
      red400: 'tomato',
      red500: '#cc0000',

      primary: '$purple400',
      primaryDark: '$purple500',
    },
    space: {
      1: '10px',
      2: '20px',
    },
    fontSizes: {},
  },
  utils: {
    px: (config) => (value) => ({
      paddingLeft: value,
      paddingRight: value,
    }),
  },
  conditions: {
    bp1: '@media (min-width: 400px)',
  },
});
