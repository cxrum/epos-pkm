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
      id: "heading-1",
      title: "Heading 1",
      typeId: "def:heading",
      command: () => {
        console.log("HEADER 1");
      },
    },
    {
      id: "heading-2",
      title: "Heading 2",
      typeId: "def:heading",
      command: () => {
        console.log("HEADER 2");
      },
    },
  ];

  const getMatchIndices = (text: string, query: string): [number, number][] => {
    const escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const regex = new RegExp(escapedQuery, "gi");
    return [...text.matchAll(regex)].map((m) => [
      m.index!,
      m.index! + m[0].length,
    ]);
  };

  const fetchFiltered = async (
    query: string,
  ): Promise<FilteredCommandType[]> => {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return stubItems.map((item) => ({
        ...item,
        matchIndices: { title: [], id: [], typeId: [] },
      }));
    }

    const results: FilteredCommandType[] = [];

    for (const item of stubItems) {
      const titleMatches = getMatchIndices(item.title, normalizedQuery);
      const idMatches = getMatchIndices(item.id, normalizedQuery);
      const typeIdMatches = getMatchIndices(item.typeId, normalizedQuery);

      if (
        titleMatches.length > 0 ||
        idMatches.length > 0 ||
        typeIdMatches.length > 0
      ) {
        results.push({
          ...item,
          matchIndices: {
            title: titleMatches,
            id: idMatches,
            typeId: typeIdMatches,
          },
        });
      }
    }

    return results;
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

  const parse = (commandLine: string): string | undefined => {
    const item = stubItems.find(
      (i) => i.title.toLowerCase() === commandLine.toLowerCase(),
    )?.id;
    return item;
  };

  return {
    fetchFiltered,
    execute,
    parse,
  };
}
