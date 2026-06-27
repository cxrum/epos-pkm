import { isSystemProperty, type BasePropertiesScheme } from "../domain/type";
import type { EpPropertyType, Icon } from "../types";
import type { PropertyEntry } from "./type";

export function resolveIcon(type: EpPropertyType): Icon {
  if (type === "boolean") {
    return {
      type: "emoji",
      emoji: "B",
    };
  } else if (type === "number") {
    return {
      type: "emoji",
      emoji: "N",
    };
  } else if (type === "select") {
    return {
      type: "emoji",
      emoji: "S",
    };
  } else if (type === "text") {
    return {
      type: "emoji",
      emoji: "T",
    };
  } else {
    return {
      type: "emoji",
      emoji: "U",
    };
  }
}

export function convertDomainProperties(
  scheme: BasePropertiesScheme,
): PropertyEntry[] {
  const resPropertyScheme: PropertyEntry[] = [];

  for (const propId of scheme.order) {
    const prop = scheme.props[propId];
    resPropertyScheme.push({
      id: prop.id,
      parentType: undefined,
      title: prop.title,
      type: prop.type,
      icon: resolveIcon(prop.type),
      isChangeable: prop.isChangeable,
      isSystem: isSystemProperty(prop),
    });
  }

  return resPropertyScheme;
}
