"use client";

import { Loader2, FilePlus, FileEdit, Eye, Trash2, FileOutput } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

interface ToolCallDisplayProps {
  tool: ToolInvocation;
}

export function getToolDisplayInfo(tool: ToolInvocation): { label: string; icon: React.ReactNode } {
  const { toolName, args } = tool;
  const command = args?.command as string;
  const path = args?.path as string;
  const newPath = args?.new_path as string;

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return {
          label: `Creating ${path || "file"}`,
          icon: <FilePlus className="w-3 h-3" />,
        };
      case "str_replace":
        return {
          label: `Editing ${path || "file"}`,
          icon: <FileEdit className="w-3 h-3" />,
        };
      case "insert":
        return {
          label: `Editing ${path || "file"}`,
          icon: <FileEdit className="w-3 h-3" />,
        };
      case "view":
        return {
          label: `Reading ${path || "file"}`,
          icon: <Eye className="w-3 h-3" />,
        };
      default:
        return {
          label: `${command || "Processing"} ${path || "file"}`,
          icon: <FileEdit className="w-3 h-3" />,
        };
    }
  }

  if (toolName === "file_manager") {
    switch (command) {
      case "rename":
        return {
          label: `Renaming ${path || "file"} to ${newPath || "new name"}`,
          icon: <FileOutput className="w-3 h-3" />,
        };
      case "delete":
        return {
          label: `Deleting ${path || "file"}`,
          icon: <Trash2 className="w-3 h-3" />,
        };
      default:
        return {
          label: `${command || "Processing"} ${path || "file"}`,
          icon: <FileEdit className="w-3 h-3" />,
        };
    }
  }

  return {
    label: toolName,
    icon: <FileEdit className="w-3 h-3" />,
  };
}

export function ToolCallDisplay({ tool }: ToolCallDisplayProps) {
  const isComplete = tool.state === "result" && tool.result !== undefined;
  const { label, icon } = getToolDisplayInfo(tool);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-600">{icon}</span>
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-600">{icon}</span>
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
