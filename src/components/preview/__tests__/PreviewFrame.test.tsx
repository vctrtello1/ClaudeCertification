import { test, expect, vi, afterEach, describe, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PreviewFrame } from "../PreviewFrame";

const mockGetAllFiles = vi.fn();
let mockRefreshTrigger = 0;

vi.mock("@/lib/contexts/file-system-context", () => ({
  useFileSystem: () => ({
    getAllFiles: mockGetAllFiles,
    refreshTrigger: mockRefreshTrigger,
  }),
}));

vi.mock("@/lib/transform/jsx-transformer", () => ({
  createImportMap: vi.fn(() => ({
    importMap: { imports: {} },
    styles: "",
    errors: [],
  })),
  createPreviewHTML: vi.fn(() => "<html><body>preview</body></html>"),
}));

beforeEach(() => {
  mockGetAllFiles.mockReturnValue(new Map());
  mockRefreshTrigger = 0;
});

afterEach(() => {
  cleanup();
});

describe("first load state", () => {
  test("shows welcome message on first load with no files", () => {
    mockGetAllFiles.mockReturnValue(new Map());
    render(<PreviewFrame />);
    expect(screen.getByText("Welcome to UI Generator")).toBeDefined();
  });

  test("shows instructional text on first load", () => {
    mockGetAllFiles.mockReturnValue(new Map());
    render(<PreviewFrame />);
    expect(
      screen.getByText("Ask the AI to create your first component to see it live here")
    ).toBeDefined();
  });
});

describe("error state", () => {
  test("shows 'No Preview Available' when files exist but no JSX entry point", () => {
    const files = new Map([
      ["/styles.css", "body { color: red; }"],
      ["/readme.md", "# Readme"],
    ]);
    mockGetAllFiles.mockReturnValue(files);
    render(<PreviewFrame />);
    expect(screen.getByText("No Preview Available")).toBeDefined();
  });

  test("shows message about creating React component when no entry point found", () => {
    const files = new Map([["/data.json", "{}"]]);
    mockGetAllFiles.mockReturnValue(files);
    render(<PreviewFrame />);
    expect(
      screen.getByText(
        "No React component found. Create an App.jsx or index.jsx file to get started."
      )
    ).toBeDefined();
  });
});

describe("iframe rendering", () => {
  test("renders iframe when App.jsx exists", () => {
    const files = new Map([["/App.jsx", "export default () => <div/>"]]);
    mockGetAllFiles.mockReturnValue(files);
    render(<PreviewFrame />);
    expect(screen.getByTitle("Preview")).toBeDefined();
  });

  test("renders iframe when App.tsx exists", () => {
    const files = new Map([["/App.tsx", "export default () => <div/>"]]);
    mockGetAllFiles.mockReturnValue(files);
    render(<PreviewFrame />);
    expect(screen.getByTitle("Preview")).toBeDefined();
  });

  test("renders iframe when index.jsx exists", () => {
    const files = new Map([["/index.jsx", "export default () => <div/>"]]);
    mockGetAllFiles.mockReturnValue(files);
    render(<PreviewFrame />);
    expect(screen.getByTitle("Preview")).toBeDefined();
  });

  test("renders iframe when src/App.jsx exists", () => {
    const files = new Map([["/src/App.jsx", "export default () => <div/>"]]);
    mockGetAllFiles.mockReturnValue(files);
    render(<PreviewFrame />);
    expect(screen.getByTitle("Preview")).toBeDefined();
  });

  test("iframe has correct sandbox attributes", () => {
    const files = new Map([["/App.jsx", "export default () => <div/>"]]);
    mockGetAllFiles.mockReturnValue(files);
    render(<PreviewFrame />);
    const iframe = screen.getByTitle("Preview");
    expect(iframe.getAttribute("sandbox")).toContain("allow-scripts");
    expect(iframe.getAttribute("sandbox")).toContain("allow-same-origin");
  });

  test("falls back to first JSX file when no standard entry point found", () => {
    const files = new Map([["/custom/MyComponent.jsx", "export default () => <div/>"]]);
    mockGetAllFiles.mockReturnValue(files);
    render(<PreviewFrame />);
    expect(screen.getByTitle("Preview")).toBeDefined();
  });
});
