// @flow
import React from 'react';
import ReactDOM from 'react-dom';

import { SimpleReactTreeTable } from '../src';

const EXAMPLE_TREE_DATA = [
  {
    id: 0,
    data: { size: 1000, main: 'Root', isRoot: 'true' },
    children: [1, 2, 3],
  },
  { id: 1, data: { size: 500, main: 'C1' }, children: [4] },
  { id: 2, data: { size: 250, main: 'C2' }, children: [] },
  { id: 3, data: { size: 250, main: 'C3' }, children: [] },
  { id: 4, data: { size: 100, main: 'C1 child' }, children: [] },
];

function Examples() {
  return <SimpleReactTreeTable treeData={EXAMPLE_TREE_DATA} />;
}

const root = document.getElementById('treeViewRoot');
if (!root) {
  throw new Error('Could not find root');
}
ReactDOM.render(<Examples />, root);
