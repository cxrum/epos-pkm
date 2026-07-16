import type { EpTypeEntity } from "../domain/type";
import { TypeRegister } from "../infra/typeRegister";
import type { EpTypeId } from "../types";

export function bootstrapTypeRegistry(registry: TypeRegister): void {
  const nodesToRegister: EpTypeEntity[] = [
    {
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
    {
      id: "sys:container",
      title: "Page",
      icon: { type: "default", name: "page" },
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
    {
      id: "def:text",
      icon: { type: "default", name: "type" },
      title: "Text",
      kind: "default",
      propertiesScheme: { order: [], props: {} },
    },
    {
      id: "def:latex",
      title: "LaTeX",
      kind: "default",
      propertiesScheme: { order: [], props: {} },
    },
    {
      id: "def:code",
      title: "Code",
      kind: "default",
      propertiesScheme: {
        order: ["codeLanguage"],
        props: {
          codeLanguage: {
            id: "codeLanguage",
            title: "Language",
            type: "text",
            kind: "system",
            isChangeable: true,
          },
        },
      },
    },
    {
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
    {
      id: "sys:hard-page-link",
      title: "Mounted Container",
      kind: "system",
      propertiesScheme: { order: [], props: {} },
    },
    {
      id: "sys:workspace",
      title: "Workspace",
      kind: "system",
      propertiesScheme: { order: [], props: {} },
    },
    {
      id: "def:back-link",
      title: "Back Link",
      kind: "default",
      propertiesScheme: {
        order: ["linkedObjectId"],
        props: {
          linkedObjectId: {
            id: "linkedObjectId",
            title: "Linked object",
            type: "autocomplete",
            kind: "system",
            isChangeable: true,
            isMulti: false,
            allowCustomOptions: false,
            allowSystemOptionsMutation: false,
            options: [],
            filterConfig: {
              allowedTypeIds: ["sys:container"],
              includeParents: false,
            },
          },
        },
      },
    },
    {
      id: "def:arrowed-link",
      title: "Arrowed Link",
      kind: "default",
      propertiesScheme: {
        order: ["arrowedQuestion", "questionWord"],
        props: {
          arrowedQuestion: {
            id: "arrowedQuestion",
            title: "Arrowed quesion",
            type: "text",
            kind: "system",
            isChangeable: true,
          },
          questionWord: {
            id: "questionWord",
            title: "Quesion word",
            type: "text",
            kind: "system",
            isChangeable: true,
          },
        },
      },
    },
  ];

  for (const node of nodesToRegister) {
    registry.register(node);
  }

  const edgesToRegister: Record<string, string[]> = {
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

  for (const [parentId, childrenIds] of Object.entries(edgesToRegister)) {
    for (const childId of childrenIds) {
      registry.registerEdge(parentId as EpTypeId, childId as EpTypeId);
    }
  }
}
