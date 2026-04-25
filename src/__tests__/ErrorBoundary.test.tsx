import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../components/ErrorBoundary";

function BrokenComponent(): JSX.Element {
    throw new Error("Test error");
}

function WorkingComponent() {
    return <div data-testid="working">Working correctly</div>;
}

describe("ErrorBoundary", () => {
    it("should render children when there is no error", () => {
        render(
            <ErrorBoundary>
                <WorkingComponent />
            </ErrorBoundary>
        );
        expect(screen.getByTestId("working")).toBeTruthy();
    });

    it("should render error fallback when child throws", () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <BrokenComponent />
            </ErrorBoundary>
        );

        expect(screen.getByText("Something went wrong")).toBeTruthy();
        expect(screen.getByText("Test error")).toBeTruthy();
        expect(screen.getByText("Try again")).toBeTruthy();

        consoleSpy.mockRestore();
    });

    it("should render custom fallback when provided", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        render(
            <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error</div>}>
                <BrokenComponent />
            </ErrorBoundary>
        );

        expect(screen.getByTestId("custom-fallback")).toBeTruthy();

        consoleSpy.mockRestore();
    });

    it("should reset error state when Try Again is clicked", () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        let shouldThrow = true;

        function ConditionalBroken() {
            if (shouldThrow) throw new Error("Conditional error");
            return <div data-testid="recovered">Recovered</div>;
        }

        const { rerender } = render(
            <ErrorBoundary>
                <ConditionalBroken />
            </ErrorBoundary>
        );

        expect(screen.getByText("Something went wrong")).toBeTruthy();

        shouldThrow = false;
        fireEvent.click(screen.getByText("Try again"));

        // After reset, component re-renders
        expect(screen.queryByText("Something went wrong")).toBeFalsy();

        consoleSpy.mockRestore();
    });
});
