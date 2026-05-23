import { beforeEach, describe, expect, it, vi } from "vitest";

const requestUseMock = vi.fn();
const responseUseMock = vi.fn();
const createMock = vi.fn((config: { baseURL?: string }) => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
        request: { use: requestUseMock },
        response: { use: responseUseMock },
    },
    defaults: { baseURL: config.baseURL },
}));

vi.mock("axios", () => ({
    default: {
        create: createMock,
    },
}));

describe("API Client", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it("should have correct base URL configuration", async () => {
        const { API_BASE_URL, api } = await import("../lib/api");

        expect(API_BASE_URL).toBe("https://backend.politefield-3469f7f1.centralindia.azurecontainerapps.io");
        expect(api.defaults.baseURL).toBe(
            "https://backend.politefield-3469f7f1.centralindia.azurecontainerapps.io"
        );
        expect(createMock).toHaveBeenCalledWith({
            baseURL: "https://backend.politefield-3469f7f1.centralindia.azurecontainerapps.io",
            headers: {
                "Content-Type": "application/json",
            },
        });
        expect(requestUseMock).toHaveBeenCalledTimes(1);
        expect(responseUseMock).toHaveBeenCalledTimes(1);
    });

    it("should call GET with correct path", async () => {
        const { api } = await import("../lib/api");
        const mockData = { current_balance: 25000 };
        (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockData });

        const result = await api.get("/api/balances/");
        expect(api.get).toHaveBeenCalledWith("/api/balances/");
        expect(result.data).toEqual(mockData);
    });

    it("should call POST with body", async () => {
        const { api } = await import("../lib/api");
        const mockResponse = { response: "Hello!", intent: "greeting" };
        (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockResponse });

        const result = await api.post("/api/chat", { message: "Hi" });
        expect(api.post).toHaveBeenCalledWith("/api/chat", { message: "Hi" });
        expect(result.data.intent).toBe("greeting");
    });

    it("should handle API errors gracefully", async () => {
        const { api } = await import("../lib/api");
        const error = new Error("Network Error");
        (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(error);

        await expect(api.get("/api/balances/")).rejects.toThrow("Network Error");
    });
});
