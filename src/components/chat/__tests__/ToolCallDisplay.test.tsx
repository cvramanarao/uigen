import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallDisplay, getToolDisplayInfo } from "../ToolCallDisplay";

afterEach(() => {
  cleanup();
});

describe("getToolDisplayInfo", () => {
  describe("str_replace_editor tool", () => {
    it("returns correct info for create command", () => {
      const tool = {
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      };
      const result = getToolDisplayInfo(tool);
      expect(result.label).toBe("Creating /App.jsx");
    });

    it("returns correct info for str_replace command", () => {
      const tool = {
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/Card.tsx" },
        state: "call",
      };
      const result = getToolDisplayInfo(tool);
      expect(result.label).toBe("Editing /Card.tsx");
    });

    it("returns correct info for insert command", () => {
      const tool = {
        toolName: "str_replace_editor",
        args: { command: "insert", path: "/utils.ts" },
        state: "call",
      };
      const result = getToolDisplayInfo(tool);
      expect(result.label).toBe("Editing /utils.ts");
    });

    it("returns correct info for view command", () => {
      const tool = {
        toolName: "str_replace_editor",
        args: { command: "view", path: "/index.jsx" },
        state: "call",
      };
      const result = getToolDisplayInfo(tool);
      expect(result.label).toBe("Reading /index.jsx");
    });

    it("handles missing path gracefully", () => {
      const tool = {
        toolName: "str_replace_editor",
        args: { command: "create" },
        state: "call",
      };
      const result = getToolDisplayInfo(tool);
      expect(result.label).toBe("Creating file");
    });

    it("handles unknown command", () => {
      const tool = {
        toolName: "str_replace_editor",
        args: { command: "unknown", path: "/test.js" },
        state: "call",
      };
      const result = getToolDisplayInfo(tool);
      expect(result.label).toBe("unknown /test.js");
    });
  });

  describe("file_manager tool", () => {
    it("returns correct info for rename command", () => {
      const tool = {
        toolName: "file_manager",
        args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
        state: "call",
      };
      const result = getToolDisplayInfo(tool);
      expect(result.label).toBe("Renaming /old.jsx to /new.jsx");
    });

    it("returns correct info for delete command", () => {
      const tool = {
        toolName: "file_manager",
        args: { command: "delete", path: "/unused.jsx" },
        state: "call",
      };
      const result = getToolDisplayInfo(tool);
      expect(result.label).toBe("Deleting /unused.jsx");
    });

    it("handles missing paths gracefully", () => {
      const tool = {
        toolName: "file_manager",
        args: { command: "rename" },
        state: "call",
      };
      const result = getToolDisplayInfo(tool);
      expect(result.label).toBe("Renaming file to new name");
    });
  });

  describe("unknown tool", () => {
    it("returns tool name as label", () => {
      const tool = {
        toolName: "custom_tool",
        args: {},
        state: "call",
      };
      const result = getToolDisplayInfo(tool);
      expect(result.label).toBe("custom_tool");
    });
  });
});

describe("ToolCallDisplay", () => {
  it("renders with loading state when not complete", () => {
    const tool = {
      toolName: "str_replace_editor",
      args: { command: "create", path: "/App.jsx" },
      state: "call",
    };
    render(<ToolCallDisplay tool={tool} />);
    expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  });

  it("renders with complete state when result exists", () => {
    const tool = {
      toolName: "str_replace_editor",
      args: { command: "create", path: "/App.jsx" },
      state: "result",
      result: "File created: /App.jsx",
    };
    render(<ToolCallDisplay tool={tool} />);
    expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  });

  it("renders editing message for str_replace", () => {
    const tool = {
      toolName: "str_replace_editor",
      args: { command: "str_replace", path: "/Button.tsx" },
      state: "result",
      result: "Replaced 1 occurrence",
    };
    render(<ToolCallDisplay tool={tool} />);
    expect(screen.getByText("Editing /Button.tsx")).toBeDefined();
  });

  it("renders delete message for file_manager", () => {
    const tool = {
      toolName: "file_manager",
      args: { command: "delete", path: "/old-file.jsx" },
      state: "call",
    };
    render(<ToolCallDisplay tool={tool} />);
    expect(screen.getByText("Deleting /old-file.jsx")).toBeDefined();
  });
});
