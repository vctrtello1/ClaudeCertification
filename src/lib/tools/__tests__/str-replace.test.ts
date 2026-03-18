import { test, expect, describe, beforeEach } from "vitest";
import { VirtualFileSystem } from "@/lib/file-system";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";

let fs: VirtualFileSystem;
let tool: ReturnType<typeof buildStrReplaceTool>;

beforeEach(() => {
  fs = new VirtualFileSystem();
  tool = buildStrReplaceTool(fs);
});

describe("buildStrReplaceTool", () => {
  test("returns a tool with id str_replace_editor", () => {
    expect(tool.id).toBe("str_replace_editor");
  });

  test("has an execute function", () => {
    expect(typeof tool.execute).toBe("function");
  });
});

describe("view command", () => {
  test("returns file content", async () => {
    fs.createFile("/App.jsx", "export default () => <div/>");
    const result = await tool.execute({ command: "view", path: "/App.jsx" });
    expect(result).toContain("export default");
  });

  test("returns content with view_range", async () => {
    fs.createFile("/file.js", "line1\nline2\nline3\nline4");
    const result = await tool.execute({
      command: "view",
      path: "/file.js",
      view_range: [1, 2],
    });
    expect(result).toContain("line1");
  });

  test("returns error message for nonexistent file", async () => {
    const result = await tool.execute({ command: "view", path: "/missing.js" });
    expect(result).toContain("not found");
  });
});

describe("create command", () => {
  test("creates a file with provided content", async () => {
    await tool.execute({
      command: "create",
      path: "/hello.jsx",
      file_text: "const x = 1;",
    });
    expect(fs.readFile("/hello.jsx")).toBe("const x = 1;");
  });

  test("creates a file with empty string when file_text omitted", async () => {
    await tool.execute({ command: "create", path: "/empty.jsx" });
    expect(fs.readFile("/empty.jsx")).toBe("");
  });

  test("creates nested directories as needed", async () => {
    await tool.execute({
      command: "create",
      path: "/src/components/Button.jsx",
      file_text: "export const Button = () => <button/>;",
    });
    expect(fs.readFile("/src/components/Button.jsx")).toContain("Button");
  });
});

describe("str_replace command", () => {
  test("replaces old string with new string", async () => {
    fs.createFile("/app.js", "const x = 1;");
    await tool.execute({
      command: "str_replace",
      path: "/app.js",
      old_str: "const x = 1;",
      new_str: "const x = 42;",
    });
    expect(fs.readFile("/app.js")).toBe("const x = 42;");
  });

  test("returns error when old_str not found", async () => {
    fs.createFile("/app.js", "const x = 1;");
    const result = await tool.execute({
      command: "str_replace",
      path: "/app.js",
      old_str: "nonexistent text",
      new_str: "replacement",
    });
    expect(result).toContain("Error");
  });

  test("uses empty strings when old_str and new_str are omitted", async () => {
    fs.createFile("/app.js", "hello world");
    // omitting old_str and new_str defaults to ""
    const result = await tool.execute({
      command: "str_replace",
      path: "/app.js",
    });
    // replaces first occurrence of "" with "" — file unchanged, no error
    expect(fs.readFile("/app.js")).toBe("hello world");
  });
});

describe("insert command", () => {
  test("inserts text after the given line", async () => {
    fs.createFile("/app.js", "line1\nline2");
    await tool.execute({
      command: "insert",
      path: "/app.js",
      insert_line: 1,
      new_str: "inserted",
    });
    expect(fs.readFile("/app.js")).toContain("inserted");
  });

  test("defaults insert_line to 0 when omitted", async () => {
    fs.createFile("/app.js", "line1");
    // Should not throw
    await expect(
      tool.execute({ command: "insert", path: "/app.js", new_str: "top" })
    ).resolves.toBeDefined();
  });
});

describe("undo_edit command", () => {
  test("returns error message explaining it is unsupported", async () => {
    const result = await tool.execute({ command: "undo_edit", path: "/app.js" });
    expect(result).toContain("not supported");
    expect(result).toContain("str_replace");
  });
});
