const SECURE_STORAGE_ERROR_PREFIX =
  "Secure OS storage is unavailable. Authentication cannot persist refresh tokens safely on this system.";

const SECURE_STORAGE_HELP_MESSAGE =
  "Secure OS storage is unavailable, so the app cannot save login tokens. On Linux, install and unlock a keyring/secret-service provider such as GNOME Keyring or KWallet, then restart the app and try again.";

export function formatAuthError(
  error: unknown,
  fallbackMessage: string,
): string {
  const message = error instanceof Error ? error.message : fallbackMessage;

  if (message.includes(SECURE_STORAGE_ERROR_PREFIX)) {
    return SECURE_STORAGE_HELP_MESSAGE;
  }

  return message;
}
