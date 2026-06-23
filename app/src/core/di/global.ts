import { ObjectsService } from "@/core/application/objectsService";
import { TypingService } from "@/core/application/typingService";
import { ObjectStorageRepository } from "@/core/infra/storage/objectsRepository";
import { TypingRepository } from "@/core/infra/storage/typeRepository";
import { IpcFileSystem } from "../infra/storage/storageRepository";
import type {
  RawContainerObject,
  RawEptTypeHierarchyNode,
} from "../infra/storage/type";
import { AppStateRepository } from "../infra/stateRepository";
import { WorkspaceStateRepository } from "../infra/workspaceRepository";
import type { WorkspaceLocalConfigEntity } from "../domain/workspace";

const containerObjectStorageApi = new IpcFileSystem<RawContainerObject>(
  "/workspace",
);
const workspaceStateApi = new IpcFileSystem<WorkspaceLocalConfigEntity>(
  undefined,
);
const typesStorageApi = new IpcFileSystem<RawEptTypeHierarchyNode>("/types");

const ROOT: RawEptTypeHierarchyNode = {
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
  children: [
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
      children: [
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
      ],
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
  ],
};

export const appStateRepository = new AppStateRepository();
export const workspaceStateRepository = new WorkspaceStateRepository(
  workspaceStateApi,
  appStateRepository,
);
const typingRepository = new TypingRepository(typesStorageApi, ROOT);
const objectRepository = new ObjectStorageRepository(containerObjectStorageApi);

export async function bootstrapWorkspaceServices() {
  await workspaceStateRepository.init();
  await typingRepository.init();
  await objectRepository.init();
}

export const globalTypingService = new TypingService(typingRepository);
export const globalObjectsService = new ObjectsService(
  typingRepository,
  objectRepository,
);
