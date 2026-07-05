import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { authRepositoryMock } = vi.hoisted(() => ({
  authRepositoryMock: {
    getStatus: vi.fn(),
    canPersistSession: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    skipAuth: vi.fn(),
  },
}));

vi.mock("@/core/di/global", () => ({
  authRepository: authRepositoryMock,
}));

import { useAuthStore } from "@/core/store/authStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    authRepositoryMock.canPersistSession.mockResolvedValue(true);
  });

  it("logs out by clearing auth state from the repository", async () => {
    authRepositoryMock.logout.mockResolvedValue({
      authenticated: false,
      skipPrompt: false,
      user: null,
    });

    const store = useAuthStore();
    store.authState = {
      authenticated: true,
      skipPrompt: false,
      user: { id: "user-1", email: "user@example.com" },
    };

    const result = await store.logout();

    expect(authRepositoryMock.logout).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      authenticated: false,
      skipPrompt: false,
      user: null,
    });
    expect(store.authState).toEqual({
      authenticated: false,
      skipPrompt: false,
      user: null,
    });
    expect(store.errorMsg).toBeUndefined();
  });

  it("keeps a session-only login when persistence is disabled", async () => {
    authRepositoryMock.login.mockResolvedValue({
      authenticated: true,
      skipPrompt: false,
      user: { id: "user-1", email: "user@example.com" },
    });

    const store = useAuthStore();
    await store.login({
      email: "user@example.com",
      password: "password",
      rememberFor30Days: false,
    });

    expect(store.noticeMsg).toBe("Signed in for this session only.");
  });

  it("explains when secure storage cannot remember a login", async () => {
    authRepositoryMock.canPersistSession.mockResolvedValue(false);
    authRepositoryMock.login.mockResolvedValue({
      authenticated: true,
      skipPrompt: false,
      user: { id: "user-1", email: "user@example.com" },
    });

    const store = useAuthStore();
    await store.loadAuthState();
    await store.login({
      email: "user@example.com",
      password: "password",
      rememberFor30Days: true,
    });

    expect(store.noticeMsg).toContain("secure storage is unavailable");
    expect(store.noticeMsg).toContain("GNOME Keyring or KWallet");
  });
});
