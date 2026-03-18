import { test, expect, vi, afterEach, describe, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "../SignUpForm";

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

describe("SignUpForm rendering", () => {
  test("renders email, password, and confirm password inputs", () => {
    render(<SignUpForm />);
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByLabelText("Confirm Password")).toBeDefined();
  });

  test("renders Sign Up submit button", () => {
    render(<SignUpForm />);
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeDefined();
  });

  test("shows minimum password length hint", () => {
    render(<SignUpForm />);
    expect(screen.getByText("Must be at least 8 characters long")).toBeDefined();
  });
});

describe("password mismatch validation", () => {
  test("shows error when passwords do not match", async () => {
    render(<SignUpForm />);

    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password1");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "password2");
    fireEvent.submit(screen.getByRole("button").closest("form")!);

    await waitFor(() =>
      expect(screen.getByText("Passwords do not match")).toBeDefined()
    );
  });

  test("does not call signUp when passwords do not match", async () => {
    render(<SignUpForm />);

    await userEvent.type(screen.getByLabelText("Password"), "password1");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "different");
    fireEvent.submit(screen.getByRole("button").closest("form")!);

    await waitFor(() => screen.getByText("Passwords do not match"));
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});

describe("successful submission", () => {
  test("calls signUp with email and password when passwords match", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    render(<SignUpForm />);

    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
    fireEvent.submit(screen.getByRole("button").closest("form")!);

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith("user@example.com", "password123")
    );
  });

  test("calls onSuccess when signUp returns success", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    const onSuccess = vi.fn();
    render(<SignUpForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
    fireEvent.submit(screen.getByRole("button").closest("form")!);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });
});

describe("error handling", () => {
  test("shows error from signUp failure", async () => {
    mockSignUp.mockResolvedValue({ success: false, error: "Email already taken" });
    render(<SignUpForm />);

    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
    fireEvent.submit(screen.getByRole("button").closest("form")!);

    await waitFor(() =>
      expect(screen.getByText("Email already taken")).toBeDefined()
    );
  });

  test("shows fallback error when no error string is provided", async () => {
    mockSignUp.mockResolvedValue({ success: false });
    render(<SignUpForm />);

    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
    fireEvent.submit(screen.getByRole("button").closest("form")!);

    await waitFor(() =>
      expect(screen.getByText("Failed to sign up")).toBeDefined()
    );
  });

  test("does not call onSuccess on failure", async () => {
    mockSignUp.mockResolvedValue({ success: false, error: "Server error" });
    const onSuccess = vi.fn();
    render(<SignUpForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "password123");
    fireEvent.submit(screen.getByRole("button").closest("form")!);

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("loading state", () => {
  test("disables all inputs and button while loading", () => {
    mockIsLoading = true;
    render(<SignUpForm />);

    expect(screen.getByLabelText("Email")).toHaveProperty("disabled", true);
    expect(screen.getByLabelText("Password")).toHaveProperty("disabled", true);
    expect(screen.getByLabelText("Confirm Password")).toHaveProperty("disabled", true);
    expect(screen.getByRole("button")).toHaveProperty("disabled", true);
  });

  test("shows 'Creating account...' text when loading", () => {
    mockIsLoading = true;
    render(<SignUpForm />);
    expect(screen.getByRole("button").textContent).toBe("Creating account...");
  });
});
