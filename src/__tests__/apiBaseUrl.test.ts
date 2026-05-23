import { describe, expect, it } from "vitest";
import { DEFAULT_API_BASE_URL, resolveApiBaseUrl } from "../lib/apiBaseUrl";

describe("resolveApiBaseUrl", () => {
    it("uses the configured API URL and trims trailing slashes", () => {
        expect(resolveApiBaseUrl("https://backend.example.com/")).toBe(
            "https://backend.example.com"
        );
    });

    it("falls back to localhost only for non-production builds", () => {
        expect(resolveApiBaseUrl("", false)).toBe(DEFAULT_API_BASE_URL);
    });

    it("fails fast in production when the API URL is missing", () => {
        expect(() => resolveApiBaseUrl("", true)).toThrow(
            "VITE_API_BASE_URL is required in production"
        );
    });
});