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
  dataMapper?: Record<
    string,
    (
      data: React.Node,
      dataMapped: Record<string, React.Node>,
      path: Array<TreeEntry>
    ) => React.Node
  >,
  sorter?: (
    a: Record<string, React.Node>,
    b: Record<string, React.Node>
  ) => number,
  columnHeaders?: Record<string, React.Node>,
  // Defaults to main
  mainColumn?: string,
  maxNodeDepth?: number,
  // If not given, treeData entries that aren't listed as children
  // will be considered roots.
  roots?: Array<TreeID>,
  // If provided, only the list columns will be shown
  fixedColumns?: Array<string>,
  contextMenu?: React.Element<any>,
  onRightClickSelection?: (item: TreeID) => void,
  onSelectionChange?: (path: Array<TreeID>) => void,
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
  dataMapper?: Record<
    string,
    (
      data: React.Node,
      dataMapped: Record<string, React.Node>,
      path: Array<TreeEntry>
    ) => React.Node
  >,
  sorter?: (
    a: Record<string, React.Node>,
    b: Record<string, React.Node>
  ) => number,
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
  const nodeSorter = (nodeIndexA, nodeIndexB) => {
    if (sorter) {
      return sorter(
        nodeIndexes[nodeIndexA].mappedData,
        nodeIndexes[nodeIndexB].mappedData
      );
    }
    return 0;
  };
  function generateNodeIndex(
    treeID: TreeID,
    parentIndex: NodeIndex | null = null,
    seenSet: Set<TreeID> = new Set(),
    pathIn?: Array<TreeEntry>
  ): NodeIndex {
    /// Adjust path
    let path: Array<TreeEntry> = pathIn || [];
    path = [...path];
    path.push((treeIDLookup.get(treeID): any));
    // If this exists already we must return the same nodeIndex
    const parentIndexType = typeof parentIndex;
    const cacheKey =
      treeID + '__SEP__' + parentIndexType + '__SEP__' + String(parentIndex);
    const cachedValue = cache.get(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }
    const wasSeen = seenSet.has(treeID);
    seenSet.add(treeID);
    const nodeIndex = nextNodeIndex++;
    const treeEntry = treeIDLookup.get(treeID);
    if (!treeEntry) {
      throw new Error('Malformed Tree');
    }
    const parentNode = parentIndex != null ? nodeIndexes[parentIndex] : null;

    let mappedData: Record<string, React.Node>;
    if (dataMapper) {
      const data: Record<string, React.Node> = treeEntry.data;
      mappedData = { ...data };
      const dataMapperNotNull = dataMapper;
      Object.keys(dataMapper).forEach((dataMapperKey) => {
        const mapperFunc = dataMapperNotNull[dataMapperKey];
        const value: React.Node = (treeEntry.data[dataMapperKey]: any);
        if (mapperFunc) {
          mappedData[dataMapperKey] = mapperFunc(value, mappedData, path);
        } else {
          mappedData[dataMapperKey] = value;
        }
      });
    } else {
      mappedData = treeEntry.data;
    }

    nodeIndexes[nodeIndex] = {
      treeEntry,
      data: treeEntry.data,
      mappedData,
      path,
      depth: parentNode != null ? parentNode.depth + 1 : 0,
      hasChildren: () => {
        if (wasSeen) {
          return false; // Don't show cycle
        }
        const children = treeEntry.children || [];
        return children.length > 0;
      },
      getChildren: () => {
        if (wasSeen) {
          return []; // Don't show cycle
        }
        const children = treeEntry.children || [];
        return children
          .map((childID) => {
            return generateNodeIndex(
              childID,
              nodeIndex,
              new Set([...seenSet]),
              path
            );
          })
          .sort(nodeSorter);
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
      return generatedRoots.sort(nodeSorter);
    },
    getDisplayData: (nodeIndex) => {
      return nodeIndexes[nodeIndex].mappedData;
    },
    hasChildren: (nodeIndex) => {
      return nodeIndexes[nodeIndex].hasChildren();
    },
    getTreeEntry: (nodeIndex) => {
      return nodeIndexes[nodeIndex].treeEntry;
    },
    getDepth: (nodeIndex) => {
      return nodeIndexes[nodeIndex].depth;
    },
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

export const SimpleTreeView = ({
  contextMenu,
  dataMapper,
  fixedColumns: fixedColumnsIn,
  mainColumn = 'main',
  maxNodeDepth = 1000,
  roots,
  sorter,
  treeData,
  onRightClickSelection,
  onSelectionChange = () => {},
}: SimpleTreeViewProps) => {
  const { transformedTree, fixedColumns } = React.useMemo(() => {
    return transformTree(treeData, mainColumn, dataMapper, sorter, roots);
  }, [treeData, roots, sorter, dataMapper]);
  const [expandedNodeIds, setExpandedNodeIds] = React.useState([]);
  const [sel, setSel] = React.useState(0);
  const onSelectionChangeInternal = React.useCallback(
    (index: NodeIndex) => {
      setSel(index);

      const path = [];

      let currIndex = index;
      while (currIndex != null) {
        let entry: TreeEntry = transformedTree.getTreeEntry(currIndex);
        path.unshift(entry.id);
        currIndex = transformedTree.getParent(currIndex);
      }
      onSelectionChange(path);
    },
    [transformedTree, onSelectionChange]
  );

  const mainColumnObj = React.useMemo(() => {
    return { propName: mainColumn, title: mainColumn };
  }, [mainColumn]);

  const effectiveFixedColumn = React.useMemo(() => {
    if (fixedColumnsIn) {
      return fixedColumnsIn.map((column) => {
        return { propName: column, title: column };
      });
    } else {
      return fixedColumns;
    }
  }, [fixedColumnsIn, fixedColumns]);

  const onRightClickSelectionInternal = React.useCallback(
    (nodeIndex) => {
      if (onRightClickSelection) {
        onRightClickSelection(transformedTree.getTreeEntry(nodeIndex).id);
      }
    },
    [onRightClickSelection, transformedTree]
  );

  return (
    <TreeView
      tree={transformedTree}
      contextMenuId="TreeViewContextMenu"
      contextMenu={contextMenu}
      mainColumn={mainColumnObj}
      indentWidth={10}
      rowHeight={16}
      fixedColumns={effectiveFixedColumn}
      onSelectionChange={onSelectionChangeInternal}
      onRightClickSelection={onRightClickSelectionInternal}
      maxNodeDepth={maxNodeDepth}
      onExpandedNodesChange={setExpandedNodeIds}
      expandedNodeIds={expandedNodeIds}
      selectedNodeId={sel}
    />
  );
};
