import ElectronStore from "electron-store";
import type { StoredAuthSession } from "../auth/types";

type AuthStoreShape = {
  auth: StoredAuthSession;
};

export const authConfig = new ElectronStore<AuthStoreShape>({
  name: "authConfig",
  defaults: {
    auth: {
      accessToken: null,
      refreshToken: null,
      tokenType: null,
      userId: null,
      userEmail: null,
      skipPrompt: false,
    },
  },
});
