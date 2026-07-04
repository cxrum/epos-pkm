import type { AuthApi, AuthCredentials, AuthState } from "../../../authApi";

export class AuthRepository implements AuthApi {
  getStatus(): Promise<AuthState> {
    return window.authApi.getStatus();
  }

  getAccessToken(): Promise<string | null> {
    return window.authApi.getAccessToken();
  }

  getSyncKey(): Promise<string | null> {
    return window.authApi.getSyncKey();
  }

  login(payload: AuthCredentials): Promise<AuthState> {
    return window.authApi.login(payload);
  }

  register(payload: AuthCredentials): Promise<AuthState> {
    return window.authApi.register(payload);
  }

  skipAuth(neverAskAgain: boolean): Promise<AuthState> {
    return window.authApi.skipAuth(neverAskAgain);
  }
}
