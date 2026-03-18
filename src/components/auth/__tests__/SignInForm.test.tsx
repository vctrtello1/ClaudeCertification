import { test, expect, vi, afterEach, describe, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "../SignInForm";

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
let mockIsLoading = false;

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    isLoading: mockIsLoading,
  }),
}));

beforeEach(() => {
  mockIsLoading = false;
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("SignInForm rendering", () => {
  test("renders email and password inputs", () => {
    render(<SignInForm />);
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
  });

  test("renders Sign In submit button", () => {
    render(<SignInForm />);
    expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
  });

  test("does not show error initially", () => {
    render(<SignInForm />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("form submission", () => {
  test("calls signIn with email and password on submit", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    render(<SignInForm />);

    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    fireEvent.submit(screen.getByRole("button", { name: "Sign In" }).closest("form")!);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("user@example.com", "password123");
    });
  });

  test("calls onSuccess when signIn returns success", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    const onSuccess = vi.fn();
    render(<SignInForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    fireEvent.submit(screen.getByRole("button").closest("form")!);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });

  test("does not call onSuccess on failure", async () => {
    mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
    const onSuccess = vi.fn();
    render(<SignInForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    fireEvent.submit(screen.getByRole("button").closest("form")!);

    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("error display", () => {
  test("shows error message from signIn failure", async () => {
    mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
    render(<SignInForm />);

    fireEvent.submit(screen.getByRole("button").closest("form")!);

    await waitFor(() =>
      expect(screen.getByText("Invalid credentials")).toBeDefined()
    );
  });

  test("shows fallback error message when no error string provided", async () => {
    mockSignIn.mockResolvedValue({ success: false });
    render(<SignInForm />);

    fireEvent.submit(screen.getByRole("button").closest("form")!);

    await waitFor(() =>
      expect(screen.getByText("Failed to sign in")).toBeDefined()
    );
  });
});

describe("loading state", () => {
  test("disables inputs and button while loading", () => {
    mockIsLoading = true;
    render(<SignInForm />);

    expect(screen.getByLabelText("Email")).toHaveProperty("disabled", true);
    expect(screen.getByLabelText("Password")).toHaveProperty("disabled", true);
    expect(screen.getByRole("button")).toHaveProperty("disabled", true);
  });

  test("shows 'Signing in...' text when loading", () => {
    mockIsLoading = true;
    render(<SignInForm />);
    expect(screen.getByRole("button").textContent).toBe("Signing in...");
  });
});
