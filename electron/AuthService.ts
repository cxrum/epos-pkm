import { safeStorage } from "electron";
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

const DEFAULT_API_BASE_URL = "http://localhost:8000";

export class AuthService {
  private readonly apiBaseUrl: string;
  private accessToken: string | null = null;
  private currentUser: AuthUser | null = null;
  private currentTokenType: string | null = null;

  constructor(apiBaseUrl: string = DEFAULT_API_BASE_URL) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/+$/, "");
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

  private async saveSession(session: Partial<StoredAuthSession>): Promise<void> {
    const current = this.getSession();
    authConfig.set("auth", {
      ...current,
      ...session,
    });
  }

  private clearRuntimeTokens(): void {
    this.accessToken = null;
    this.currentUser = null;
    this.currentTokenType = null;
  }

  private async clearSessionTokens(): Promise<void> {
    this.clearRuntimeTokens();
    await this.saveSession({
      refreshTokenEncrypted: null,
      tokenType: null,
      userId: null,
      userEmail: null,
    });
  }

  private async requestJson<T>(
    path: string,
    init: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, init);

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
  ): void {
    this.accessToken = accessToken;
    this.currentUser = user;
    this.currentTokenType = tokenType;
  }

  private async persistSession(
    pair: TokenPairResponse,
    fallbackEmail?: string,
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

    this.setRuntimeSession(pair.access_token, user, pair.token_type);
    await this.saveSession({
      refreshTokenEncrypted: this.encryptRefreshToken(pair.refresh_token),
      tokenType: pair.token_type,
      userId: user.id,
      userEmail: user.email,
      skipPrompt: false,
    });

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

    return await this.persistSession(pair, session.userEmail ?? undefined);
  }

  async getStatus(): Promise<AuthState> {
    const session = this.getSession();

    if (this.accessToken && this.currentUser) {
      return this.toState(session, true);
    }

    if (session.refreshTokenEncrypted) {
      try {
        return await this.refreshSession();
      } catch {
        await this.clearSessionTokens();
        return this.toState(this.getSession(), false);
      }
    }

    return this.toState(session, false);
  }

  async login(payload: AuthCredentials): Promise<AuthState> {
    this.assertSecureStorageAvailable();
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

    return await this.persistSession(pair, payload.email);
  }

  async register(payload: AuthCredentials): Promise<AuthState> {
    this.assertSecureStorageAvailable();
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

    return await this.persistSession(pair, payload.email);
  }

  async skipAuth(neverAskAgain: boolean): Promise<AuthState> {
    await this.clearSessionTokens();
    await this.saveSession({
      skipPrompt: neverAskAgain,
    });

    return this.toState(this.getSession(), false);
  }
}
