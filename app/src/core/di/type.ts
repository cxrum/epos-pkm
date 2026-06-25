import type { RawEptTypeHierarchyNode } from "../infra/storage/type";
import type { EpTypeId } from "../types";

const NODES: RawEptTypeHierarchyNode[] = [
  {
    id: "sys:root",
    type: {
      id: "sys:root",
      title: "root",
      kind: "system",
      propertiesScheme: {
        order: ["isContainer"],
        props: {
          isContainer: {
            id: "isContainer",
            title: "isContainer",
            type: "boolean",
            kind: "system",
            isChangeable: false,
          },
        },
      },
    },
    children: [],
  },
  {
    id: "sys:container",
    type: {
      id: "sys:container",
      title: "Page",
      icon: {
        type: "default",
        name: "page",
      },
      kind: "system",
    },
    children: [],
  },
  {
    id: "def:text",
    type: {
      id: "def:text",
      icon: {
        type: "default",
        name: "type",
      },
      title: "Text",
      kind: "default",
    },
    children: [],
  },
  {
    id: "def:latex",
    type: {
      id: "def:latex",
      title: "LaTeX",
      kind: "default",
    },
    children: [],
  },
  {
    id: "def:code",
    type: {
      id: "def:code",
      title: "Code",
      kind: "default",
      propertiesScheme: {
        order: ["codeLanguage"],
        props: {
          codeLanguage: {
            id: "codeLanguage",
            title: "codeLanguage",
            type: "text",
            kind: "system",
            isChangeable: true,
          },
        },
      },
    },
    children: [],
  },
  {
    id: "def:heading",
    type: {
      id: "def:heading",
      title: "Heading",
      kind: "default",
      propertiesScheme: {
        order: ["level"],
        props: {
          level: {
            id: "level",
            title: "level",
            type: "number",
            kind: "system",
            isChangeable: true,
          },
        },
      },
    },
    children: [],
  },
  {
    id: "sys:hard-page-link",
    type: {
      id: "sys:hard-page-link",
      title: "Mounted Container",
      kind: "system",
    },
    children: [],
  },
  {
    id: "sys:workspace",
    type: {
      id: "sys:workspace",
      title: "Workspace",
      kind: "system",
    },
    children: [],
  },
  {
    id: "def:back-link",
    type: {
      id: "def:back-link",
      title: "Back Link",
      kind: "default",
    },
    children: [],
  },
  {
    id: "def:arrowed-link",
    type: {
      id: "def:arrowed-link",
      title: "Arrowed Link",
      kind: "default",
    },
    children: [],
  },
];

const EDGES: Record<EpTypeId, EpTypeId[]> = {
  "sys:root": [
    "sys:container",
    "def:text",
    "def:back-link",
    "def:heading",
    "sys:hard-page-link",
    "sys:workspace",
  ],
  "def:back-link": ["def:arrowed-link"],
  "def:text": ["def:latex", "def:code"],
};

export function SystemRoot(): RawEptTypeHierarchyNode {
  const nodesMap = new Map<string, RawEptTypeHierarchyNode>(
    NODES.map((node) => [node.id, { ...node, children: [] }]),
  );

  for (const [parentId, childrenIds] of Object.entries(EDGES)) {
    const parent = nodesMap.get(parentId);
    if (parent) {
      parent.children = childrenIds
        .map((id) => nodesMap.get(id))
        .filter((node): node is RawEptTypeHierarchyNode => node !== undefined);
    }
  }

  return nodesMap.get("sys:root") as RawEptTypeHierarchyNode;
}
