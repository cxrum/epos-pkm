import type { TreeNode } from "@/shared/components/tree/contract";
import type { TreeStructureRepositoryContract } from "../domain/repositories/treeStructureRepositoryContract";
import { PageRepository } from "./storage/stubPageRepostory";

const get = async (): Promise<TreeNode> => {
    const pages = await PageRepository.getAll()

    const result: TreeNode = {
        id: -1,
        title: 'root',
        children: []
    }

    for(var i = 0; i < pages.length; i++){
        const el = pages[i]

        result.children.push(
            {
                id: el.id,
                title: el.title,
                type: el.type,
                children: []
            }
        )
    }

    return result
}

export const TreeStructureRepository : TreeStructureRepositoryContract = {
    get
};