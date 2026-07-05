export interface AuthCredentials {
  email: string;
  password: string;
  rememberFor30Days?: boolean;
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
  refreshTokenEncrypted: string | null;
  tokenType: string | null;
  userId: string | null;
  userEmail: string | null;
  skipPrompt: boolean;
}

export interface AuthApi {
  getStatus(): Promise<AuthState>;
  canPersistSession(): Promise<boolean>;
  login(payload: AuthCredentials): Promise<AuthState>;
  register(payload: AuthCredentials): Promise<AuthState>;
  logout(): Promise<AuthState>;
  skipAuth(neverAskAgain: boolean): Promise<AuthState>;
}
