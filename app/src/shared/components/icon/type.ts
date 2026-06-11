export interface BaseIcon {
  type: string;
}

export interface BaseDefaultIcon extends BaseIcon {
  type: "default";
  name: string;
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

export type DefaultIcon = TableIcon | PageIcon | ObjectIcon;

export interface LinkIcon extends BaseIcon {
  type: "link";
  link: string;
}

export interface EmojiIcon extends BaseIcon {
  type: "emoji";
  emoji: string;
}
