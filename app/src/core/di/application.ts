import { createObjectsService } from "../application/objectsService";
import { PageRepository } from "../infra/storage/stubPageRepository";
import { TypingRepository } from "../infra/storage/stubTypeRepository";
import { TreeStructureRepository } from "../infra/treeStructureRepository";

export const GlobalObjectsService = createObjectsService(
    PageRepository,
    TreeStructureRepository,
    TypingRepository
) 