import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";

// Mock jwt-decode
vi.mock("jwt-decode", () => ({
    jwtDecode: vi.fn(),
}));

// Mock api module
const mockGet = vi.fn();
vi.mock("../lib/api", () => ({
    api: {
        get: (...args: unknown[]) => mockGet(...args),
        post: vi.fn(),
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    },
}));

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (i: number) => Object.keys(store)[i] ?? null,
    };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
        <BrowserRouter>
            <AuthProvider>{children}</AuthProvider>
        </BrowserRouter>
    );
}

function AuthStatus() {
    const { user, isLoading } = useAuth();
    return (
        <div>
            <span data-testid="auth-status">{user ? "logged-in" : "logged-out"}</span>
            <span data-testid="loading">{isLoading ? "loading" : "ready"}</span>
            {user && <span data-testid="user-id">{user.user_id}</span>}
        </div>
    );
}

describe("AuthContext", () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    it("should start as logged out when no token exists", async () => {
        render(
            <TestWrapper>
                <AuthStatus />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("ready");
        });
        expect(screen.getByTestId("auth-status").textContent).toBe("logged-out");
    });

    it("should restore session from valid token when /api/auth/me succeeds", async () => {
        // Store a valid-format JWT
        const mockToken = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoidXNlcjEiLCJleHAiOjk5OTk5OTk5OTl9.sig";
        localStorageMock.setItem("token", mockToken);

        // Mock jwt-decode to return a valid payload
        const { jwtDecode } = await import("jwt-decode");
        (jwtDecode as ReturnType<typeof vi.fn>).mockReturnValue({
            user_id: "user1",
            exp: Math.floor(Date.now() / 1000) + 3600,
        });

        // Mock the /api/auth/me call
        mockGet.mockResolvedValue({
            data: { user_id: "user1", email: "test@test.com", full_name: "Test User", role: "user" },
        });

        render(
            <TestWrapper>
                <AuthStatus />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("ready");
        });
        expect(screen.getByTestId("auth-status").textContent).toBe("logged-in");
        expect(screen.getByTestId("user-id").textContent).toBe("user1");
    });

    it("should clear expired tokens from localStorage", async () => {
        const mockToken = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoidXNlcjEiLCJleHAiOjF9.sig";
        localStorageMock.setItem("token", mockToken);

        const { jwtDecode } = await import("jwt-decode");
        (jwtDecode as ReturnType<typeof vi.fn>).mockReturnValue({
            user_id: "user1",
            exp: 1, // Expired
        });

        render(
            <TestWrapper>
                <AuthStatus />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("ready");
        });
        expect(screen.getByTestId("auth-status").textContent).toBe("logged-out");
        expect(localStorageMock.getItem("token")).toBeNull();
    });

    it("should handle malformed tokens", async () => {
        localStorageMock.setItem("token", "not_a_jwt");

        render(
            <TestWrapper>
                <AuthStatus />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByTestId("loading").textContent).toBe("ready");
        });
        expect(screen.getByTestId("auth-status").textContent).toBe("logged-out");
    });
});
