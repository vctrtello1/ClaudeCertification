import { test, expect, vi, afterEach, describe } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AuthDialog } from "../AuthDialog";

// Mock child form components so tests focus on AuthDialog behavior
vi.mock("../SignInForm", () => ({
  SignInForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button data-testid="signin-form" onClick={onSuccess}>
      SignInForm
    </button>
  ),
}));

vi.mock("../SignUpForm", () => ({
  SignUpForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button data-testid="signup-form" onClick={onSuccess}>
      SignUpForm
    </button>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("AuthDialog visibility", () => {
  test("renders dialog when open is true", () => {
    render(
      <AuthDialog open={true} onOpenChange={vi.fn()} />
    );
    expect(screen.getByText("Welcome back")).toBeDefined();
  });

  test("does not render content when open is false", () => {
    render(
      <AuthDialog open={false} onOpenChange={vi.fn()} />
    );
    expect(screen.queryByText("Welcome back")).toBeNull();
  });
});

describe("default mode", () => {
  test("shows sign-in form by default", () => {
    render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByTestId("signin-form")).toBeDefined();
    expect(screen.queryByTestId("signup-form")).toBeNull();
  });

  test("shows sign-up form when defaultMode is signup", () => {
    render(
      <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
    );
    expect(screen.getByTestId("signup-form")).toBeDefined();
    expect(screen.queryByTestId("signin-form")).toBeNull();
  });
});

describe("title and description", () => {
  test("shows sign-in title in signin mode", () => {
    render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Welcome back")).toBeDefined();
    expect(screen.getByText("Sign in to your account to continue")).toBeDefined();
  });

  test("shows sign-up title in signup mode", () => {
    render(
      <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
    );
    expect(screen.getByText("Create an account")).toBeDefined();
    expect(
      screen.getByText("Sign up to start creating AI-powered React components")
    ).toBeDefined();
  });
});

describe("mode toggle", () => {
  test("switches to signup mode when 'Sign up' link is clicked", () => {
    render(<AuthDialog open={true} onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByTestId("signup-form")).toBeDefined();
    expect(screen.getByText("Create an account")).toBeDefined();
  });

  test("switches back to signin mode when 'Sign in' link is clicked", () => {
    render(
      <AuthDialog open={true} onOpenChange={vi.fn()} defaultMode="signup" />
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByTestId("signin-form")).toBeDefined();
    expect(screen.getByText("Welcome back")).toBeDefined();
  });
});

describe("onSuccess callback", () => {
  test("calls onOpenChange(false) when SignInForm succeeds", () => {
    const onOpenChange = vi.fn();
    render(<AuthDialog open={true} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByTestId("signin-form"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("calls onOpenChange(false) when SignUpForm succeeds", () => {
    const onOpenChange = vi.fn();
    render(
      <AuthDialog
        open={true}
        onOpenChange={onOpenChange}
        defaultMode="signup"
      />
    );
    fireEvent.click(screen.getByTestId("signup-form"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
