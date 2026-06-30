export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthState {
  authenticated: boolean;
  skipPrompt: boolean;
  user: AuthUser | null;
}

export interface StoredAuthSession {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  userId: string | null;
  userEmail: string | null;
  skipPrompt: boolean;
}

export interface AuthApi {
  getStatus(): Promise<AuthState>;
  login(payload: AuthCredentials): Promise<AuthState>;
  register(payload: AuthCredentials): Promise<AuthState>;
  skipAuth(neverAskAgain: boolean): Promise<AuthState>;
}
