import type { EpObjectId } from "@/core/types";
import mitt from "mitt";

export type ApplicationEvents = {
  "object:update": { id: EpObjectId };
};

export const applicationBus = mitt<ApplicationEvents>();

export function objectUpdated(id: EpObjectId) {
  applicationBus.emit("object:update", { id });
}
