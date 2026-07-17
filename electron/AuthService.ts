import { safeStorage } from "electron";
import { createHash, pbkdf2Sync } from "crypto";
import { authConfig } from "./electronStore/authentication";
import type {
  AuthCredentials,
  AuthState,
  AuthUser,
  StoredAuthSession,
} from "./auth/types";

interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  id: string;
}

interface MeResponse {
  id: string;
  email: string;
}

export class AuthService {
  private readonly resolveApiBaseUrl: () => Promise<string> | string;
  private accessToken: string | null = null;
  private accessTokenExpiresAt: number | null = null;
  private currentUser: AuthUser | null = null;
  private currentTokenType: string | null = null;
  private currentSyncKey: string | null = null;

  constructor(resolveApiBaseUrl: () => Promise<string> | string = () => "") {
    this.resolveApiBaseUrl = resolveApiBaseUrl;
  }

  private getSession(): StoredAuthSession {
    return authConfig.get("auth");
  }

  private hasSecureStorage(): boolean {
    return safeStorage.isEncryptionAvailable();
  }

  private assertSecureStorageAvailable(): void {
    if (!this.hasSecureStorage()) {
      throw new Error(
        "Secure OS storage is unavailable. Authentication cannot persist refresh tokens safely on this system.",
      );
    }
  }

  private shouldPersistSession(rememberFor30Days: boolean): boolean {
    return rememberFor30Days && this.hasSecureStorage();
  }

  private encryptRefreshToken(refreshToken: string): string {
    this.assertSecureStorageAvailable();
    return safeStorage.encryptString(refreshToken).toString("base64");
  }

  private decryptRefreshToken(encrypted: string | null): string | null {
    if (!encrypted) {
      return null;
    }

    this.assertSecureStorageAvailable();
    return safeStorage.decryptString(Buffer.from(encrypted, "base64"));
  }

  private deriveSyncKey(user: AuthUser, secret: string): string {
    const salt = createHash("sha256")
      .update(`epos-pkm-sync:${user.id}`)
      .digest();

    return pbkdf2Sync(secret, salt, 210000, 32, "sha256").toString("base64");
  }

  private resolveStoredSyncKey(session: StoredAuthSession): string | null {
    if (this.currentSyncKey) {
      return this.currentSyncKey;
    }

    if (!session.syncKeyEncrypted || !this.hasSecureStorage()) {
      return null;
    }

    return safeStorage.decryptString(
      Buffer.from(session.syncKeyEncrypted, "base64"),
    );
  }

  private async saveSession(session: Partial<StoredAuthSession>): Promise<void> {
    const current = this.getSession();
    authConfig.set("auth", {
      ...current,
      ...session,
    });
  }

  private clearRuntimeTokens(): void {
    this.accessToken = null;
    this.accessTokenExpiresAt = null;
    this.currentUser = null;
    this.currentTokenType = null;
  }

  private clearRuntimeSyncKey(): void {
    this.currentSyncKey = null;
  }

  private async clearStoredSession(): Promise<void> {
    await this.saveSession({
      refreshTokenEncrypted: null,
      tokenType: null,
      userId: null,
      userEmail: null,
      syncKeyEncrypted: null,
    });
  }

  private async clearSessionTokens(): Promise<void> {
    this.clearRuntimeTokens();
    this.clearRuntimeSyncKey();
    await this.clearStoredSession();
  }

  private async requestJson<T>(
    path: string,
    init: RequestInit,
  ): Promise<T> {
    const apiBaseUrl = (await this.resolveApiBaseUrl())
      .trim()
      .replace(/\/+$/, "");
    if (!apiBaseUrl) {
      throw new Error("Set the sync server URL before authorizing.");
    }
    const response = await fetch(`${apiBaseUrl}${path}`, init);

    if (!response.ok) {
      throw new Error(await this.readErrorMessage(response));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async readErrorMessage(response: Response): Promise<string> {
    try {
      const payload = (await response.json()) as { detail?: unknown };
      if (typeof payload.detail === "string") {
        return payload.detail;
      }
      if (Array.isArray(payload.detail)) {
        return payload.detail
          .map((item) => {
            if (typeof item === "string") {
              return item;
            }
            if (item && typeof item === "object" && "msg" in item) {
              return String((item as { msg?: unknown }).msg ?? "");
            }
            return "";
          })
          .filter(Boolean)
          .join(", ");
      }
    } catch {
      // Fall through to the plain text body.
    }

    try {
      const text = await response.text();
      if (text.trim()) {
        return text;
      }
    } catch {
      // Ignore and use the status code fallback.
    }

    return `Request failed with status ${response.status}`;
  }

  private async fetchProfile(accessToken: string): Promise<AuthUser> {
    const profile = await this.requestJson<MeResponse>("/v1/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      id: profile.id,
      email: profile.email,
    };
  }

  private setRuntimeSession(
    accessToken: string,
    user: AuthUser,
    tokenType: string,
    accessTokenExpiresAt: number | null,
  ): void {
    this.accessToken = accessToken;
    this.accessTokenExpiresAt = accessTokenExpiresAt;
    this.currentUser = user;
    this.currentTokenType = tokenType;
  }

  private parseTokenExpiry(token: string): number | null {
    try {
      const [, payload] = token.split(".");
      if (!payload) {
        return null;
      }

      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
      const decoded = JSON.parse(
        Buffer.from(`${normalized}${padding}`, "base64").toString("utf-8"),
      ) as { exp?: unknown };

      if (typeof decoded.exp !== "number") {
        return null;
      }

      return decoded.exp * 1000;
    } catch {
      return null;
    }
  }

  private isRuntimeAccessTokenExpired(): boolean {
    if (!this.accessToken || this.accessTokenExpiresAt === null) {
      return false;
    }

    const refreshSkewMs = 60_000;
    return Date.now() >= this.accessTokenExpiresAt - refreshSkewMs;
  }

  private async ensureAccessToken(): Promise<string | null> {
    if (this.accessToken && !this.isRuntimeAccessTokenExpired()) {
      return this.accessToken;
    }

    const session = this.getSession();
    const refreshToken = this.decryptRefreshToken(session.refreshTokenEncrypted);

    if (!refreshToken) {
      return this.isRuntimeAccessTokenExpired() ? null : this.accessToken;
    }

    try {
      const pair = await this.requestJson<TokenPairResponse>("/v1/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      const syncKey = this.resolveStoredSyncKey(session) ?? undefined;
      await this.persistSession(pair, session.userEmail ?? undefined, {
        persistToStorage: true,
        syncKey,
      });
      return this.accessToken;
    } catch {
      await this.clearSessionTokens();
      return null;
    }
  }

  private setRuntimeSyncKey(syncKey: string): void {
    this.currentSyncKey = syncKey;
  }

  private async persistSession(
    pair: TokenPairResponse,
    fallbackEmail?: string,
    options?: {
      persistToStorage?: boolean;
      syncSecret?: string;
      syncKey?: string;
    },
  ): Promise<AuthState> {
    let user: AuthUser = {
      id: pair.id,
      email: fallbackEmail ?? this.getSession().userEmail ?? "Unknown user",
    };

    try {
      user = await this.fetchProfile(pair.access_token);
    } catch {
      // Keep the login/register flow usable even if profile lookup is unavailable.
    }

    this.accessTokenExpiresAt = this.parseTokenExpiry(pair.access_token);
    this.setRuntimeSession(
      pair.access_token,
      user,
      pair.token_type,
      this.accessTokenExpiresAt,
    );

    const syncKey =
      options?.syncKey ??
      (options?.syncSecret ? this.deriveSyncKey(user, options.syncSecret) : null);

    if (syncKey) {
      this.setRuntimeSyncKey(syncKey);
    }

    if (options?.persistToStorage) {
      await this.saveSession({
        refreshTokenEncrypted: this.encryptRefreshToken(pair.refresh_token),
        tokenType: pair.token_type,
        userId: user.id,
        userEmail: user.email,
        syncKeyEncrypted:
          syncKey && this.hasSecureStorage()
            ? safeStorage.encryptString(syncKey).toString("base64")
            : null,
        skipPrompt: false,
      });
    } else {
      await this.clearStoredSession();
    }

    return {
      authenticated: true,
      skipPrompt: false,
      user,
    };
  }

  private toState(
    session: StoredAuthSession,
    authenticated: boolean,
  ): AuthState {
    const user = authenticated
      ? this.currentUser ??
        (session.userId && session.userEmail
          ? {
              id: session.userId,
              email: session.userEmail,
            }
          : null)
      : null;

    return {
      authenticated,
      skipPrompt: session.skipPrompt,
      user,
    };
  }

  private async refreshSession(): Promise<AuthState> {
    const session = this.getSession();
    const refreshToken = this.decryptRefreshToken(session.refreshTokenEncrypted);

    if (!refreshToken) {
      return this.toState(session, false);
    }

    const pair = await this.requestJson<TokenPairResponse>("/v1/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    return await this.persistSession(pair, session.userEmail ?? undefined, {
      persistToStorage: true,
      syncKey: this.resolveStoredSyncKey(session) ?? undefined,
    });
  }

  async getStatus(): Promise<AuthState> {
    const session = this.getSession();

    if (this.accessToken && this.currentUser && !this.isRuntimeAccessTokenExpired()) {
      return this.toState(session, true);
    }

    if (session.refreshTokenEncrypted) {
      if (!this.hasSecureStorage()) {
        await this.clearSessionTokens();
        return this.toState(this.getSession(), false);
      }

      try {
        return await this.refreshSession();
      } catch {
        await this.clearSessionTokens();
        return this.toState(this.getSession(), false);
      }
    }

    return this.toState(session, false);
  }

  canPersistSession(): Promise<boolean> {
    return Promise.resolve(this.hasSecureStorage());
  }

  async getAccessToken(): Promise<string | null> {
    return await this.ensureAccessToken();
  }

  getSyncKey(): string | null {
    if (this.currentSyncKey) {
      return this.currentSyncKey;
    }

    const session = this.getSession();
    const encrypted = session.syncKeyEncrypted;
    if (!encrypted || !this.hasSecureStorage()) {
      return null;
    }

    this.currentSyncKey = safeStorage.decryptString(Buffer.from(encrypted, "base64"));
    return this.currentSyncKey;
  }

  async login(payload: AuthCredentials): Promise<AuthState> {
    const rememberFor30Days = payload.rememberFor30Days ?? true;
    const body = new URLSearchParams({
      email: payload.email,
      password: payload.password,
    });

    const pair = await this.requestJson<TokenPairResponse>("/v1/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    return await this.persistSession(pair, payload.email, {
      persistToStorage: this.shouldPersistSession(rememberFor30Days),
      syncSecret: payload.password,
    });
  }

  async register(payload: AuthCredentials): Promise<AuthState> {
    const rememberFor30Days = payload.rememberFor30Days ?? true;
    const pair = await this.requestJson<TokenPairResponse>(
      "/v1/users/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    return await this.persistSession(pair, payload.email, {
      persistToStorage: this.shouldPersistSession(rememberFor30Days),
      syncSecret: payload.password,
    });
  }

  async logout(): Promise<AuthState> {
    await this.clearSessionTokens();

    return this.toState(this.getSession(), false);
  }

  async skipAuth(neverAskAgain: boolean): Promise<AuthState> {
    await this.clearSessionTokens();
    await this.saveSession({
      skipPrompt: neverAskAgain,
    });

    return this.toState(this.getSession(), false);
  }
}
