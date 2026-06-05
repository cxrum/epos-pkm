import type { PageEntity } from "@/core/domain/type";
import type { PageDTO } from "./types";
import type { ObjectStorageRepositoryContract } from "@/core/domain/repositories/objectRepositoryContract";

const Mapper = {
  toDomain(dto: PageDTO): PageEntity {
    return {
      id: dto.id,
      title: dto.title,
      path: [],
      type: dto.type,
      content: dto.content,
    };
  },

  toDTO(entity: PageEntity): PageDTO {
    return {
      id: entity.id,
      title: entity.title,
      type: entity.type,
      content: entity.content as Record<string, any>,
    };
  },
};

const pagesDb: Record<number, PageDTO> = {
  1: {
    id: 1,
    title: "A1",
    content: {},
    type: {
      id: "page",
      name: "Default Page Type",
      icon: {
        id: "icon-default-document",
        type: "default",
        name: "document",
      },
    },
  },
  2: {
    id: 2,
    title: "A2",
    content: {},
    type: {
      id: "page",
      name: "Default Page Type",
      icon: {
        id: "icon-default-document",
        type: "default",
        name: "document",
      },
    },
  },
  3: {
    id: 3,
    title: "A3",
    content: {},
    type: {
      id: "page",
      name: "Default Page Type",
      icon: {
        id: "icon-default-document",
        type: "default",
        name: "document",
      },
    },
  },
};

const savePage = async (page: PageEntity): Promise<PageEntity> => {
  const dtoToSave = Mapper.toDTO(page);
  const savedDTO = {
    ...dtoToSave,
    updatedAt: Date.now(),
  };

  pagesDb[savedDTO.id] = savedDTO;
  console.log(`[DB Stub] Saved page ID: ${savedDTO.id}`, savedDTO);

  return Mapper.toDomain(savedDTO);
};

const getPage = async (pageId: number): Promise<PageEntity | null> => {
  const pageDTO = pagesDb[pageId];

  if (!pageDTO) {
    console.warn(`[DB Stub] Page ID: ${pageId} not found.`);
    return null;
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  return Mapper.toDomain(pageDTO);
};

const getAllPages = async (): Promise<PageEntity[]> => {
  const allDTOs = Object.values(pagesDb);
  return allDTOs.map((dto) => Mapper.toDomain(dto));
};

export const PageRepository: ObjectStorageRepositoryContract = {
  save: savePage,
  get: getPage,
  getAll: getAllPages,
};
