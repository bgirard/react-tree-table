import React from 'react';
import ReactDOM from 'react-dom';

import { ReactTreeTable } from '../src';

const exampleTree = {
  getRoots: () => {
    return [0];
  },
  getDisplayData: (index) => {return {type: "Row " + index, name: "name"};},
  hasChildren: (index) => { return index < 10; },
  getDepth: (index) => index + 1,
  getChildren: (index) => {
    if (index < 10) {
      return [index + 1];
    } else {
      return [];
    }
  },
};

const mainColumn = {propName: "name", title: "name"};
const fixedColumns = [{propName: "type", title: "type"}];

function Examples() {
  const [expandedNodeIds, setExpandedNodeIds] = React.useState([]);
  const [sel, setSel] = React.useState(0);
  return React.createElement(ReactTreeTable, {tree: exampleTree, contextMenuId: "test", mainColumn, indentWidth: 16, rowHeight: 32, fixedColumns, onSelectionChange: (node) => {setSel(node)}, maxNodeDepth: 10000, onExpandedNodesChange: (e) => {setExpandedNodeIds(e)}, expandedNodeIds: expandedNodeIds, selectedNodeId: sel});;
}

ReactDOM.render(<Examples/>, document.getElementById("root"));