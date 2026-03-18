import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeTool(
  toolName: string,
  args: Record<string, string>,
  state: "call" | "result" = "call"
): ToolInvocation {
  if (state === "result") {
    return { toolCallId: "1", toolName, args, state, result: "ok" };
  }
  return { toolCallId: "1", toolName, args, state };
}

// str_replace_editor labels

test("shows 'Creating' for str_replace_editor create", () => {
  render(<ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "create", path: "/App.jsx" })} />);
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor str_replace", () => {
  render(<ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "str_replace", path: "/components/Button.tsx" })} />);
  expect(screen.getByText("Editing /components/Button.tsx")).toBeDefined();
});

test("shows 'Editing' for str_replace_editor insert", () => {
  render(<ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "insert", path: "/utils.ts" })} />);
  expect(screen.getByText("Editing /utils.ts")).toBeDefined();
});

test("shows 'Reading' for str_replace_editor view", () => {
  render(<ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "view", path: "/App.jsx" })} />);
  expect(screen.getByText("Reading /App.jsx")).toBeDefined();
});

// file_manager labels

test("shows 'Renaming' for file_manager rename", () => {
  render(<ToolInvocationBadge tool={makeTool("file_manager", { command: "rename", path: "/old.tsx", new_path: "/new.tsx" })} />);
  expect(screen.getByText("Renaming /old.tsx to /new.tsx")).toBeDefined();
});

test("shows 'Deleting' for file_manager delete", () => {
  render(<ToolInvocationBadge tool={makeTool("file_manager", { command: "delete", path: "/unused.ts" })} />);
  expect(screen.getByText("Deleting /unused.ts")).toBeDefined();
});

// Fallback

test("falls back to toolName for unknown tool", () => {
  render(<ToolInvocationBadge tool={makeTool("unknown_tool", {})} />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("falls back to 'Processing {path}' for unknown command with a path", () => {
  render(<ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })} />);
  expect(screen.getByText("Processing /App.jsx")).toBeDefined();
});

// State: loading vs done

test("shows spinner when state is 'call'", () => {
  const { container } = render(
    <ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "create", path: "/App.jsx" }, "call")} />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when state is 'result'", () => {
  const { container } = render(
    <ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "create", path: "/App.jsx" }, "result")} />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});
