import type { EpObjectId, EpPropertyId } from "@/core/types";
import mitt from "mitt";

export type ApplicationEvents = {
  "object:update": { id: EpObjectId };
  "draft:property-updated": {
    targetObjectId: EpObjectId;
    propertyId: EpPropertyId;
    newValue: any;
  };
};

export const applicationBus = mitt<ApplicationEvents>();

export function objectUpdated(id: EpObjectId) {
  applicationBus.emit("object:update", { id });
}
