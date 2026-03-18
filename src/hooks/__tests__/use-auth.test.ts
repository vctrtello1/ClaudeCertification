// @vitest-environment jsdom
import { test, expect, vi, describe, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignInAction = vi.fn();
const mockSignUpAction = vi.fn();
vi.mock("@/actions", () => ({
  signIn: (...args: any[]) => mockSignInAction(...args),
  signUp: (...args: any[]) => mockSignUpAction(...args),
}));

const mockGetAnonWorkData = vi.fn();
const mockClearAnonWork = vi.fn();
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: () => mockGetAnonWorkData(),
  clearAnonWork: () => mockClearAnonWork(),
}));

const mockGetProjects = vi.fn();
vi.mock("@/actions/get-projects", () => ({
  getProjects: () => mockGetProjects(),
}));

const mockCreateProject = vi.fn();
vi.mock("@/actions/create-project", () => ({
  createProject: (...args: any[]) => mockCreateProject(...args),
}));

// Dynamic import so mocks are applied first
const { useAuth } = await import("@/hooks/use-auth");

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" });
});

describe("initial state", () => {
  test("isLoading starts as false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("exposes signIn and signUp functions", () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
  });
});

describe("signIn", () => {
  test("returns result from signInAction", async () => {
    mockSignInAction.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth());

    let returned: any;
    await act(async () => {
      returned = await result.current.signIn("a@b.com", "pass");
    });

    expect(returned).toEqual({ success: true });
  });

  test("resets isLoading to false after execution completes", async () => {
    mockSignInAction.mockResolvedValue({ success: false });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "pass");
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("navigates to existing project after successful sign-in", async () => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([{ id: "proj-1" }]);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "pass");
    });

    expect(mockPush).toHaveBeenCalledWith("/proj-1");
  });

  test("creates new project and navigates when no projects exist", async () => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "fresh-project" });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "pass");
    });

    expect(mockCreateProject).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/fresh-project");
  });

  test("creates project from anon work and navigates when anon work exists", async () => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue({
      messages: [{ role: "user", content: "hi" }],
      fileSystemData: { "/App.jsx": "code" },
    });
    mockCreateProject.mockResolvedValue({ id: "anon-project" });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "pass");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: "user", content: "hi" }],
        data: { "/App.jsx": "code" },
      })
    );
    expect(mockClearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/anon-project");
  });

  test("does not navigate when signIn fails", async () => {
    mockSignInAction.mockResolvedValue({ success: false, error: "Bad creds" });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("a@b.com", "wrong");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("signUp", () => {
  test("returns result from signUpAction", async () => {
    mockSignUpAction.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth());

    let returned: any;
    await act(async () => {
      returned = await result.current.signUp("a@b.com", "pass123");
    });

    expect(returned).toEqual({ success: true });
  });

  test("navigates after successful sign-up", async () => {
    mockSignUpAction.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([{ id: "proj-99" }]);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("a@b.com", "pass123");
    });

    expect(mockPush).toHaveBeenCalledWith("/proj-99");
  });

  test("does not navigate when signUp fails", async () => {
    mockSignUpAction.mockResolvedValue({ success: false, error: "Email taken" });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("a@b.com", "pass123");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  test("isLoading returns to false even when signUp throws", async () => {
    mockSignUpAction.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signUp("a@b.com", "pass");
      } catch {
        // expected
      }
    });

    expect(result.current.isLoading).toBe(false);
  });
});
