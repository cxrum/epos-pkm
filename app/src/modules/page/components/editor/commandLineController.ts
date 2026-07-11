import type { Editor, Range } from "@tiptap/core";
import type {
  CommandControllerContract,
  CommandType,
  FilteredCommandType,
} from "./extension/commandLine/commandLineControllerContract";
import type { Emitter } from "mitt";
import type { ApplicationEvents } from "@/bus/application";
import type { EpTypeEntity, UserTypeEntity } from "@/core/domain/type";

const SYSTEM_LIST: CommandType[] = [
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
  {
    id: "heading-3",
    title: "Heading 3",
    typeId: "def:heading",
    command: () => {
      console.log("HEADER 3");
    },
  },
  {
    id: "heading-4",
    title: "Heading 4",
    typeId: "def:heading",
    command: () => {
      console.log("HEADER 4");
    },
  },
  {
    id: "heading-5",
    title: "Heading 5",
    typeId: "def:heading",
    command: () => {
      console.log("HEADER 5");
    },
  },
];

export function useBaseCommandLineController(
  applicationBus: Emitter<ApplicationEvents>,
): CommandControllerContract {
  let items: CommandType[] = [...SYSTEM_LIST];

  const extendList = (list: UserTypeEntity[]): void => {
    const res: CommandType[] = [];

    for (const entry of list) {
      const _res: CommandType = {
        id: slug(entry.title),
        title: entry.title,
        typeId: entry.id,
        command: ({ editor, props, range }) => {
          console.log(props, range);
        },
      };
      res.push(_res);
    }

    items = SYSTEM_LIST.concat(res);
  };

  const slug = (entry: string): string => {
    return entry.split(" ").join("-").toLocaleLowerCase();
  };

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
      return items.map((item) => ({
        ...item,
        matchIndices: { title: [], id: [], typeId: [] },
      }));
    }

    const results: FilteredCommandType[] = [];

    for (const item of items) {
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
    id: string,
    editor: Editor,
    props?: Record<string, any>,
    range?: { from: number; to: number },
  ): void => {
    const item = items.find((i) => i.id.toLowerCase() === id.toLowerCase());

    if (item) {
      item.command({ editor, props, range });
    }
  };

  const parse = (commandLine: string): string | undefined => {
    const item = items.find(
      (i) => i.title.toLowerCase() === commandLine.toLowerCase(),
    )?.id;
    return item;
  };

  return {
    extendList,
    fetchFiltered,
    execute,
    parse,
  };
}
