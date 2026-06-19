export interface BaseIcon {
  type: string;
}

export interface BaseDefaultIcon extends BaseIcon {
  type: "default";
  name: string;
}

export interface ErrorIcon extends BaseDefaultIcon {
  name: "error";
}

export interface TableIcon extends BaseDefaultIcon {
  name: "table";
}

export interface PageIcon extends BaseDefaultIcon {
  name: "page";
}

export interface ObjectIcon extends BaseDefaultIcon {
  name: "object";
}

export interface TypeIcon extends BaseDefaultIcon {
  name: "type";
}

export type DefaultIcon =
  | TableIcon
  | PageIcon
  | ObjectIcon
  | ErrorIcon
  | TypeIcon;

export interface LinkIcon extends BaseIcon {
  type: "link";
  link: string;
}

export interface EmojiIcon extends BaseIcon {
  type: "emoji";
  emoji: string;
}
