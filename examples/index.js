import React from 'react';
import ReactDOM from 'react-dom';

import { ReactTreeTable } from '../src';

const exampleTree = {
  getRoots: () => {
    return [0];
  },
  getDisplayData: (NodeIndex) => {return {samples: "Row " + NodeIndex};},
  hasChildren: () => false,
  getDepth: () => 0,
  getChildren: () => [],
};

const mainColumn = [{propName: "samples", titleL10nId: "Samples"}];
const fixedColumns = [{propName: "samples", titleL10nId: "Samples"}];

function Examples() {
  return React.createElement(ReactTreeTable, {tree: exampleTree, contextMenuId: "test", mainColumn, indentWidth: 16, rowHeight: 32, fixedColumns, onSelectionChange: () => {}, maxNodeDepth: 10000, onExpandedNodesChange: () => {}, expandedNodeIds: [], selectedNodeId: null});;
}

ReactDOM.render(React.createElement(Examples, {}), document.getElementById("root"));