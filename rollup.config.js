import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import external from 'rollup-plugin-peer-deps-external';
import flow from 'rollup-plugin-flow';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import url from '@rollup/plugin-url';

import pkg from './package.json';

export default {
  external: ['react', 'react-dom'],
  globals: {
    react: 'React',
    'react-dom': 'ReactDOM',
  },
  input: 'src/index.js',
  output: [
    {
      file: 'bundle.min.js',
      name: 'ReactTreeTable',
      format: 'cjs',
    },
  ],
  plugins: [
    external(),
    flow(),
    postcss({
      modules: true,
    }),
    babel({
      exclude: 'node_modules/**',
    }),
    replace({
      'process.env.NODE_ENV': 'true',
    }),
    resolve(),
    commonjs(),
  ],
};
