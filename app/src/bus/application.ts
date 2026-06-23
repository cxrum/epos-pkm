import mitt from "mitt";

export type ApplicationEvents = {
  "workspace:loaded": { id: string; absolutePath: string };
  "notification:error": string;
  "editor:save-request": void;
};

export const applicationBus = mitt<ApplicationEvents>();
