"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

function getLabel(tool: ToolInvocation): string {
  const args = tool.args as Record<string, string>;
  const path = args.path ?? "";

  if (tool.toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return `Creating ${path}`;
      case "str_replace":
      case "insert":
        return `Editing ${path}`;
      case "view":
        return `Reading ${path}`;
    }
  }

  if (tool.toolName === "file_manager") {
    switch (args.command) {
      case "rename":
        return `Renaming ${path} to ${args.new_path ?? ""}`;
      case "delete":
        return `Deleting ${path}`;
    }
  }

  return path ? `Processing ${path}` : tool.toolName;
}

interface ToolInvocationBadgeProps {
  tool: ToolInvocation;
}

export function ToolInvocationBadge({ tool }: ToolInvocationBadgeProps) {
  const done = tool.state === "result";
  const label = getLabel(tool);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
