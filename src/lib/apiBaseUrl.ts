const DEFAULT_DEV_API_BASE_URL = "http://localhost:8000";

function normalizeApiBaseUrl(baseUrl: string): string {
    return baseUrl.trim().replace(/\/+$/, "");
}

export function resolveApiBaseUrl(
    apiBaseUrl: string | undefined = import.meta.env.VITE_API_BASE_URL,
    isProduction: boolean = import.meta.env.PROD
): string {
    const configuredBaseUrl = apiBaseUrl?.trim();

    if (configuredBaseUrl) {
        return normalizeApiBaseUrl(configuredBaseUrl);
    }

    if (isProduction) {
        throw new Error(
            "VITE_API_BASE_URL is required in production. Set it to the HTTPS backend URL."
        );
    }

    return DEFAULT_DEV_API_BASE_URL;
}

export const DEFAULT_API_BASE_URL = DEFAULT_DEV_API_BASE_URL;