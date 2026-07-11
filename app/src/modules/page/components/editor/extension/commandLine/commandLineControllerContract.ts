import type { UserTypeEntity } from "@/core/domain/type";
import type { EpTypeId } from "@/core/types";
import type { Editor } from "@tiptap/core";
import type { InjectionKey } from "vue";

export interface CommandType {
  id: string;
  title: string;
  typeId: EpTypeId;
  command: (props: {
    editor: Editor;
    props?: Record<string, any>;
    range?: { from: number; to: number };
  }) => void;
}

export type FilteredCommandType = CommandType & {
  matchIndices: {
    title: [number, number][];
    id: [number, number][];
    typeId: [number, number][];
  };
};

export interface CommandControllerContract {
  fetchFiltered(query: string): Promise<FilteredCommandType[]>;
  parse(commandLine: string): string | undefined;
  execute(
    id: string,
    editor: Editor,
    props?: Record<string, any>,
    range?: { from: number; to: number },
  ): void;
  extendList(list: UserTypeEntity[]): void;
}

export const CommandLineControllerKey: InjectionKey<CommandControllerContract> =
  Symbol("CommandLineController");
