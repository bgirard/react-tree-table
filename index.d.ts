
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
  // Quickly remapped the columns from one type to another
  dataMapper?: Record<string, (data: React.Node, dataMapped: Record<string, React.Node>, path: Array<TreeEntry>) => React.Node>,
  sorter?: (
    a: Record<string, React.Node>,
    b: Record<string, React.Node>
  ) => number,
};

export function SimpleReactTreeTable(props: SimpleTreeViewProps): ReactElement;
