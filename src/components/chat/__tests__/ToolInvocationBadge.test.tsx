import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// str_replace_editor — create
test("shows 'Creating' label for str_replace_editor create command", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/components/Card.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
});

// str_replace_editor — str_replace
test("shows 'Editing' label for str_replace_editor str_replace command", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "src/App.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

// str_replace_editor — insert
test("shows 'Editing' label for str_replace_editor insert command", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "src/index.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing index.tsx")).toBeDefined();
});

// str_replace_editor — view
test("shows 'Reading' label for str_replace_editor view command", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "src/App.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Reading App.tsx")).toBeDefined();
});

// file_manager — delete
test("shows 'Deleting' label for file_manager delete command", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      args={{ command: "delete", path: "src/OldComponent.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Deleting OldComponent.jsx")).toBeDefined();
});

// file_manager — rename
test("shows 'Renaming' label for file_manager rename command", () => {
  render(
    <ToolInvocationBadge
      toolName="file_manager"
      args={{ command: "rename", path: "src/Old.jsx", new_path: "src/New.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Renaming Old.jsx to New.jsx")).toBeDefined();
});

// Fallback for unknown tool
test("shows 'Updating file' for unknown tool", () => {
  render(
    <ToolInvocationBadge
      toolName="unknown_tool"
      args={{}}
      state="call"
    />
  );
  expect(screen.getByText("Updating file")).toBeDefined();
});

// Fallback when path is missing
test("shows fallback label when path is missing", () => {
  render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating file")).toBeDefined();
});

// Spinner shown while in progress
test("shows spinner when state is not result", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/Card.jsx" }}
      state="call"
    />
  );
  // Loader2 renders as an svg with animate-spin
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

// Green dot shown when done
test("shows green dot when state is result with a result", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/Card.jsx" }}
      state="result"
      result="File created"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

// Still shows spinner when state is result but result is undefined
test("shows spinner when state is result but result is undefined", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/Card.jsx" }}
      state="result"
      result={undefined}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});
