import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../lib/api";

vi.mock("../lib/api", () => {
    const interceptors = {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
    };
    return {
        api: {
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            interceptors,
            defaults: { baseURL: "http://localhost:8000" },
        },
    };
});

describe("API Client", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should have correct base URL configuration", () => {
        expect(api.defaults.baseURL).toBe("http://localhost:8000");
    });

    it("should call GET with correct path", async () => {
        const mockData = { current_balance: 25000 };
        (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

        const result = await api.get("/api/balances/");
        expect(api.get).toHaveBeenCalledWith("/api/balances/");
        expect(result.data).toEqual(mockData);
    });

    it("should call POST with body", async () => {
        const mockResponse = { response: "Hello!", intent: "greeting" };
        (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

        const result = await api.post("/api/chat", { message: "Hi" });
        expect(api.post).toHaveBeenCalledWith("/api/chat", { message: "Hi" });
        expect(result.data.intent).toBe("greeting");
    });

    it("should handle API errors gracefully", async () => {
        const error = new Error("Network Error");
        (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(api.get("/api/balances/")).rejects.toThrow("Network Error");
    });
});
