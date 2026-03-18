import { test, expect, describe, beforeEach } from "vitest";
import { VirtualFileSystem } from "@/lib/file-system";
import { buildFileManagerTool } from "@/lib/tools/file-manager";

type ToolExec = NonNullable<ReturnType<typeof buildFileManagerTool>["execute"]>;
type ToolOptions = Parameters<ToolExec>[1];
const opts = { toolCallId: "test", messages: [] } as unknown as ToolOptions;

let fs: VirtualFileSystem;
let tool: ReturnType<typeof buildFileManagerTool>;

beforeEach(() => {
  fs = new VirtualFileSystem();
  tool = buildFileManagerTool(fs);
});

describe("buildFileManagerTool", () => {
  test("returns a tool with an execute function", () => {
    expect(typeof tool.execute).toBe("function");
  });
});

describe("rename command", () => {
  test("renames an existing file and returns success", async () => {
    fs.createFile("/old.jsx", "content");
    const result = await tool.execute!(
      { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
      opts
    );
    expect(result.success).toBe(true);
    expect(fs.readFile("/new.jsx")).toBe("content");
    expect(fs.readFile("/old.jsx")).toBeNull();
  });

  test("returns success message with both paths", async () => {
    fs.createFile("/a.jsx", "x");
    const result = await tool.execute!(
      { command: "rename", path: "/a.jsx", new_path: "/b.jsx" },
      opts
    );
    expect((result as any).message).toContain("/a.jsx");
    expect((result as any).message).toContain("/b.jsx");
  });

  test("returns error when new_path is missing", async () => {
    fs.createFile("/a.jsx", "x");
    const result = await tool.execute!({ command: "rename", path: "/a.jsx" }, opts);
    expect(result.success).toBe(false);
    expect((result as any).error).toContain("new_path");
  });

  test("returns failure when source file does not exist", async () => {
    const result = await tool.execute!(
      { command: "rename", path: "/nonexistent.jsx", new_path: "/dest.jsx" },
      opts
    );
    expect(result.success).toBe(false);
  });
});

describe("delete command", () => {
  test("deletes an existing file and returns success", async () => {
    fs.createFile("/to-delete.jsx", "content");
    const result = await tool.execute!(
      { command: "delete", path: "/to-delete.jsx" },
      opts
    );
    expect(result.success).toBe(true);
    expect(fs.readFile("/to-delete.jsx")).toBeNull();
  });

  test("returns success message with path", async () => {
    fs.createFile("/app.jsx", "x");
    const result = await tool.execute!({ command: "delete", path: "/app.jsx" }, opts);
    expect((result as any).message).toContain("/app.jsx");
  });

  test("returns failure when file does not exist", async () => {
    const result = await tool.execute!(
      { command: "delete", path: "/missing.jsx" },
      opts
    );
    expect(result.success).toBe(false);
    expect((result as any).error).toBeDefined();
  });

  test("deletes a directory and its contents", async () => {
    fs.createDirectory("/components");
    fs.createFile("/components/Button.jsx", "x");
    const result = await tool.execute!(
      { command: "delete", path: "/components" },
      opts
    );
    expect(result.success).toBe(true);
  });
});
