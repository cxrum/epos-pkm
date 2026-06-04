import type { ObjectStorageRepositoryContract } from "../domain/repositories/objectRepositoryContract"
import type { TreeStructureRepositoryContract } from "../domain/repositories/treeStructureRepositoryContract"
import type { TypingRepositoryContract } from "../domain/repositories/typesRepositoryContract"
import type { ObjetServiceContract } from "../store/services/objectsContract"
import type { EpObjectId } from "../types"
import type { EpObject } from "./types"


export const createObjectsService = (
   objectRepo: ObjectStorageRepositoryContract,
   treeRepo: TreeStructureRepositoryContract,
   typingRepo: TypingRepositoryContract
): ObjetServiceContract   => {


const get = (id: EpObjectId): EpObject => {

}

const getAll = (): EpObject[] => {

}

const getTree = (): TreeNode => {

}

const getPaths = (): Record<PageId, ObjectPath> => {

}

const getObjectPath = (id: PageId): ObjectPath => {
        
}


return {
        get,
        getAll,
        getTree,
        getPaths,
        getObjectPath
   }
}
        