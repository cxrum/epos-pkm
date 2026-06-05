export interface BaseIcon {}

export interface DefaultIcon extends BaseIcon {
  type: "default";
  name: "table" | "document" | "object";
}

export interface LinkIcon extends BaseIcon {
  type: "link";
  link: string;
}

export interface EmojiIcon extends BaseIcon {
  type: "emoji";
  emoji: string;
}
