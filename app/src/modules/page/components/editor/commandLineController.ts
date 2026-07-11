import type { Editor, Range } from "@tiptap/core";
import type {
  CommandControllerContract,
  CommandType,
} from "./extension/commandLine/commandLineControllerContract";
import type { Emitter } from "mitt";
import type { ApplicationEvents } from "@/bus/application";

export function useBaseCommandLineController(
  applicationBus: Emitter<ApplicationEvents>,
): CommandControllerContract {
  const stubItems: CommandType[] = [
    {
      title: "Heading 1",
      typeId: "def:heading",
      command: () => {
        console.log("HEADER 1");
      },
    },
    {
      title: "Heading 2",
      typeId: "def:heading",
      command: () => {
        console.log("HEADER 2");
      },
    },
  ];

  const fetchFiltered = async (query: string): Promise<CommandType[]> => {
    return stubItems.filter((item) =>
      item.title.toLowerCase().startsWith(query.toLowerCase()),
    );
  };

  const execute = (
    commandString: string,
    editor: Editor,
    typeProps: Record<string, any>,
  ): void => {
    const item = stubItems.find(
      (i) => i.title.toLowerCase() === commandString.toLowerCase(),
    );

    if (item) {
      item.command({ editor, typeProps });
    }
  };

  return {
    fetchFiltered,
    execute,
  };
}
