import type { EpTypeId } from "@/core/types";
import type { Editor } from "@tiptap/core";
import type { InjectionKey } from "vue";

export interface CommandType {
  title: string;
  typeId: EpTypeId;
  command: (props: { editor: Editor; typeProps: Record<string, any> }) => void;
}

export interface CommandControllerContract {
  fetchFiltered(query: string): Promise<CommandType[]>;
  execute(
    commandString: string,
    editor: Editor,
    props: Record<string, any>,
  ): void;
}

export const CommandLineControllerKey: InjectionKey<CommandControllerContract> =
  Symbol("CommandLineController");
