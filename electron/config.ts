function parseBoolean(value: string | undefined) {
    if (!value) return false;

    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export const isDev = parseBoolean(process.env.APP_IS_DEV);
export const APP_NAME = process.env.APP_NAME || "Undefined";
