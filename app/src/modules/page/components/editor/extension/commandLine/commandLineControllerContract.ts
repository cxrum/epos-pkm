import type { EpTypeId } from "@/core/types";
import type { Editor } from "@tiptap/core";
import type { InjectionKey } from "vue";

export interface CommandType {
  id: string;
  title: string;
  typeId: EpTypeId;
  command: (props: { editor: Editor; typeProps: Record<string, any> }) => void;
}

export interface CommandControllerContract {
  fetchFiltered(query: string): Promise<CommandType[]>;
  parse(commandLine: string): string | undefined;
  execute(
    id: string,
    editor: Editor,
    props?: Record<string, any>,
    range?: { from: number; to: number },
  ): void;
}

export const CommandLineControllerKey: InjectionKey<CommandControllerContract> =
  Symbol("CommandLineController");
