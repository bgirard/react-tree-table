/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// @flow

import * as React from 'react';

import { TreeView } from './TreeView';

type Record<T, V> = {
  [T]: V,
};
type NodeIndex = number;

export type TreeID = number | string;

export type TreeEntry = {
  id: TreeID,
  children?: Array<TreeID>,
  data: Record<string, React.Node>,
};

export type TreeData = Array<TreeEntry>;

export type SimpleTreeViewProps = {
  treeData: TreeData,
  columnHeaders?: Record<string, React.Node>,
  // Defaults to main
  mainColumn?: string,
  maxNodeDepth?: number,
  // If not given, treeData entries that aren't listed as children
  // will be considered roots.
  roots?: Array<TreeID>,
};

type InternalTreeType = {
  getDepth(NodeIndex): number,
  getRoots(): NodeIndex[],
  getDisplayData(NodeIndex): Record<string, React.Node>,
  getParent(NodeIndex): NodeIndex,
  getChildren(NodeIndex): NodeIndex[],
  hasChildren(NodeIndex): boolean,
  getAllDescendants(NodeIndex): Set<NodeIndex>,
};

function findFixedColumns(tree: TreeData, mainColumn: string) {
  const columnsFound = new Set();
  tree.forEach((entry) => {
    Object.keys(entry.data).forEach((key) => columnsFound.add(key));
  });
  columnsFound.delete(mainColumn);
  const fixedColumn = [...columnsFound].map((columnFound) => {
    return { propName: columnFound, title: columnFound };
  });
  return fixedColumn;
}

function transformTree(
  tree: TreeData,
  mainColumn: string,
  rootsInitial?: Array<TreeID>
) {
  let roots: Array<TreeID> = [];
  let index = 0;

  if (rootsInitial) {
    roots = [...rootsInitial];
  } else {
    const idListedHasChildren: Set<TreeID> = new Set();
    tree.forEach((entry) => {
      const children = entry.children || [];
      children.forEach((childTreeID) => {
        idListedHasChildren.add(childTreeID);
      });
    });
    tree.forEach((entry) => {
      if (!idListedHasChildren.has(entry.id)) {
        roots.push(entry.id);
      }
    });
  }

  const treeIDLookup: Map<TreeID, TreeEntry> = new Map();
  tree.forEach((entry) => {
    treeIDLookup.set(entry.id, entry);
  });

  let nextNodeIndex = 0;
  const nodeIndexes = {};
  const cache: Map<string, NodeIndex> = new Map();
  function generateNodeIndex(
    treeID: TreeID,
    parentIndex: NodeIndex | null = null
  ): NodeIndex {
    // If this exists already we must return the same nodeIndex
    const parentIndexType = typeof parentIndex;
    const cacheKey =
      treeID + '__SEP__' + parentIndexType + '__SEP__' + String(parentIndex);
    const cachedValue = cache.get(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }
    const nodeIndex = nextNodeIndex++;
    const treeEntry = treeIDLookup.get(treeID);
    if (!treeEntry) {
      throw new Error('Malformed Tree');
    }
    const parentNode = parentIndex ? nodeIndexes[parentIndex] : null;
    nodeIndexes[nodeIndex] = {
      data: treeEntry.data,
      depth: parentNode ? parentNode.depth + 1 : 1,
      hasChildren: () => {
        const children = treeEntry.children || [];
        return children.length > 0;
      },
      getChildren: () => {
        const children = treeEntry.children || [];
        return children.map((childID) => {
          return generateNodeIndex(childID, nodeIndex);
        });
      },
      parentIndex,
    };
    cache.set(cacheKey, nodeIndex);
    return nodeIndex;
  }

  const generatedRoots: Array<NodeIndex> = roots.map((root) => {
    return generateNodeIndex(root);
  });
  const transformedTree = {
    getRoots: () => {
      return generatedRoots;
    },
    getDisplayData: (nodeIndex) => {
      return nodeIndexes[nodeIndex].data;
    },
    hasChildren: (nodeIndex) => {
      return nodeIndexes[nodeIndex].hasChildren();
    },
    getDepth: (nodeIndex) => nodeIndexes[nodeIndex].depth,
    getChildren: (nodeIndex) => {
      return nodeIndexes[nodeIndex].getChildren(index);
    },
    getParent: (nodeIndex) => {
      return nodeIndexes[nodeIndex].parentIndex;
    },
    getAllDescendants: () => {
      throw 'Error';
    },
  };

  const fixedColumns = findFixedColumns(tree, mainColumn);

  return { transformedTree, fixedColumns };
}

export function SimpleTreeView({
  treeData,
  roots,
  mainColumn = 'main',
  maxNodeDepth = 1000,
}: SimpleTreeViewProps) {
  const { transformedTree, fixedColumns } = React.useMemo(() => {
    return transformTree(treeData, mainColumn, roots);
  }, [treeData, roots]);
  const [expandedNodeIds, setExpandedNodeIds] = React.useState([]);
  const [sel, setSel] = React.useState(0);

  const mainColumnObj = { propName: mainColumn, title: mainColumn };

  return (
    <TreeView
      tree={transformedTree}
      contextMenuId="test"
      mainColumn={mainColumnObj}
      indentWidth={10}
      rowHeight={16}
      fixedColumns={fixedColumns}
      onSelectionChange={setSel}
      maxNodeDepth={maxNodeDepth}
      onExpandedNodesChange={setExpandedNodeIds}
      expandedNodeIds={expandedNodeIds}
      selectedNodeId={sel}
    />
  );
}
