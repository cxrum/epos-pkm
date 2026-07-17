import type { Editor } from "@tiptap/core";
import type {
  CommandControllerContract,
  CommandType,
  FilteredCommandType,
} from "./extension/commandLine/commandLineControllerContract";
import type { UserTypeEntity } from "@/core/domain/type";
import type { EpTypeId } from "@/core/types";
import { SYSTEM_BLOCK_CONFIG } from "./helpers";

export function useBaseCommandLineController(): CommandControllerContract {
  const SYSTEM_LIST: CommandType[] = SYSTEM_BLOCK_CONFIG.flatMap((config) =>
    config.variants.map((variantProps) => {
      const variantValues = Object.values(variantProps).map(
        (prop: any) => prop.value,
      );
      const hasVariants = variantValues.length > 0;

      const suffix = hasVariants ? `-${variantValues.join("-")}` : "";
      const titleSuffix = hasVariants ? ` ${variantValues.join(" ")}` : "";

      return {
        id: `${config.baseId}${suffix}`,
        title: `${config.titlePrefix}${titleSuffix}`,
        typeId: config.typeId,
        command: (props) => {
          replaceNodeWithObject(props.editor, config.typeId, variantProps);
        },
      };
    }),
  );

  let items: CommandType[] = [...SYSTEM_LIST];

  const replaceNodeWithObject = (
    editor: Editor,
    objectTypeId: EpTypeId,
    props: Record<string, any>,
    range?: { from: number; to: number },
  ) => {
    const newId = crypto.randomUUID();

    if (range) {
      editor
        .chain()
        .deleteRange(range)
        .insertInlineObject({
          id: newId,
          typeId: objectTypeId,
          props: props,
        })
        .focus()
        .run();
    } else {
      editor
        .chain()
        .command(({ tr, state }) => {
          const { $from } = state.selection;
          tr.delete($from.start(), $from.end());
          return true;
        })
        .insertInlineObject({
          id: newId,
          typeId: objectTypeId,
          props: props,
        })
        .focus()
        .run();
    }
  };

  const extendList = (list: UserTypeEntity[]): void => {
    const res: CommandType[] = [];

    for (const entry of list) {
      const _res: CommandType = {
        id: slug(entry.title),
        title: entry.title,
        typeId: entry.id,
        command: (props) => {
          replaceNodeWithObject(props.editor, entry.id, {});
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
    const matches = [...text.matchAll(regex)];

    return matches.map((m) => [m.index!, m.index! + m[0].length]);
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
