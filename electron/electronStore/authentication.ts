import ElectronStore from "electron-store";
import type { StoredAuthSession } from "../auth/types";

type AuthStoreShape = {
  auth: StoredAuthSession;
};

export const authConfig = new ElectronStore<AuthStoreShape>({
  name: "authConfig",
  defaults: {
    auth: {
      refreshTokenEncrypted: null,
      tokenType: null,
      userId: null,
      userEmail: null,
      syncKeyEncrypted: null,
      skipPrompt: false,
    },
  },
});

export function migrateLegacyAuthFields(): void {
  const auth = authConfig.get("auth") as unknown as StoredAuthSession & {
    accessToken?: unknown;
    refreshToken?: unknown;
  };

  authConfig.set("auth", {
    refreshTokenEncrypted: auth.refreshTokenEncrypted ?? null,
    tokenType: auth.tokenType ?? null,
    userId: auth.userId ?? null,
    userEmail: auth.userEmail ?? null,
    syncKeyEncrypted: auth.syncKeyEncrypted ?? null,
    skipPrompt: auth.skipPrompt ?? false,
  });
}
