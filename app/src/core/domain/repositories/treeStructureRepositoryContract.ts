import type { TreeNode } from "@/shared/components/tree/contract";

export interface TreeStructureRepositoryContract {
    get(): Promise<TreeNode>
}