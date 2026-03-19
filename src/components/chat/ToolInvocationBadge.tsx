"use client";

import { Loader2, FilePlus, FilePen, FileSearch, Trash2, FolderInput } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

function getLabel(
  toolName: string,
  args: Record<string, unknown>
): { icon: React.ReactNode; text: string } {
  const path = typeof args.path === "string" ? args.path : "";
  const filename = path ? basename(path) : "";

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return {
          icon: <FilePlus className="w-3 h-3" />,
          text: filename ? `Creating ${filename}` : "Creating file",
        };
      case "str_replace":
      case "insert":
        return {
          icon: <FilePen className="w-3 h-3" />,
          text: filename ? `Editing ${filename}` : "Editing file",
        };
      case "view":
        return {
          icon: <FileSearch className="w-3 h-3" />,
          text: filename ? `Reading ${filename}` : "Reading file",
        };
      default:
        return {
          icon: <FilePen className="w-3 h-3" />,
          text: filename ? `Updating ${filename}` : "Updating file",
        };
    }
  }

  if (toolName === "file_manager") {
    if (args.command === "delete") {
      return {
        icon: <Trash2 className="w-3 h-3" />,
        text: filename ? `Deleting ${filename}` : "Deleting file",
      };
    }
    if (args.command === "rename") {
      const newFilename =
        typeof args.new_path === "string" ? basename(args.new_path) : "";
      return {
        icon: <FolderInput className="w-3 h-3" />,
        text:
          filename && newFilename
            ? `Renaming ${filename} to ${newFilename}`
            : "Renaming file",
      };
    }
  }

  return { icon: <FilePen className="w-3 h-3" />, text: "Updating file" };
}

export function ToolInvocationBadge({
  toolName,
  args,
  state,
  result,
}: ToolInvocationBadgeProps) {
  const done = state === "result" && result !== undefined;
  const { icon, text } = getLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-600">{icon}</span>
      <span className="text-neutral-700">{text}</span>
    </div>
  );
}
