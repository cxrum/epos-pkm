import type { PageData, PageStorageRepository } from "@/modules/contracts/pageRepositoryContract";

interface PageDTO {
  id: number;
  title: string;
  content: Record<string, any>;
  type?: string;
  updatedAt?: number;
}

const Mapper = {
  toDomain(dto: PageDTO): PageData {
    return {
      id: dto.id,
      title: dto.title,
      type: dto.type,
      path: [],
      content: dto.content,
    };
  },

  toDTO(entity: PageData): PageDTO {
    return {
      id: entity.id,
      title: entity.title,
      type: entity.type,
      content: entity.content as Record<string, any>,
    };
  }
};

const pagesDb: Record<number, PageDTO> = {
    1: {
        id:1,
        title: 'A1',
        content: {},
        type: 'page',
    },
    2: {
        id:2,
        title: 'A2',
        content: {},
        type: 'page',
    },
    3: {
        id:3,
        title: 'A3',
        content: {},
        type: 'page',
    }
};

const savePage = async (page: PageData): Promise<PageData> => {
  const dtoToSave = Mapper.toDTO(page);
  const savedDTO = { 
    ...dtoToSave, 
    updatedAt: Date.now() 
  };
  
  pagesDb[savedDTO.id] = savedDTO;
  console.log(`[DB Stub] Saved page ID: ${savedDTO.id}`, savedDTO);
  
  return Mapper.toDomain(savedDTO);
};

const getPage = async (pageId: number): Promise<PageData | null> => {
  const pageDTO = pagesDb[pageId];
  
  if (!pageDTO) {
    console.warn(`[DB Stub] Page ID: ${pageId} not found.`);
    return null;
  }
  
  await new Promise((resolve) => setTimeout(resolve, 100));

  return Mapper.toDomain(pageDTO); 
};

const getAllPages = async (): Promise<PageData[]> => {
  const allDTOs = Object.values(pagesDb);
  
  return allDTOs.map(dto => Mapper.toDomain(dto));
};

export const PageRepository : PageStorageRepository = {
  save: savePage,
  get: getPage,
  getAll: getAllPages
};