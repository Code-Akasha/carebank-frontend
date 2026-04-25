import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock all API calls
vi.mock("../lib/api", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    },
}));

// Mock AuthContext
vi.mock("../context/AuthContext", () => ({
    useAuth: () => ({
        user: { user_id: "user_test1", role: "user", username: "testuser", full_name: "Test User" },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { api } from "../lib/api";
import Dashboard from "../pages/Dashboard";

function renderDashboard() {
    return render(
        <BrowserRouter>
            <Dashboard />
        </BrowserRouter>
    );
}

describe("Dashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should show loading spinner initially", () => {
        (api.get as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
        renderDashboard();
        expect(document.querySelector(".animate-spin")).toBeTruthy();
    });

    it("should display balance after API call resolves", async () => {
        (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url.includes("balances")) return Promise.resolve({ data: { current_balance: 50000, available_balance: 48000 } });
            if (url.includes("health-score")) return Promise.resolve({ data: { score: 72, message: "Good" } });
            if (url.includes("transactions")) return Promise.resolve({ data: { transactions: [] } });
            return Promise.resolve({ data: {} });
        });

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/50,000/)).toBeTruthy();
        });
    });

    it("should handle API failure gracefully", async () => {
        (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network Error"));
        renderDashboard();

        // Should not crash — error boundary or try/catch handles it
        await waitFor(() => {
            expect(document.querySelector(".animate-pulse")).toBeFalsy();
        });
    });
});
