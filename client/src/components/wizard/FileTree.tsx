import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

interface FileTreeProps {
  tree: FileNode[];
  selectedPath?: string;
  onFileSelect: (path: string) => void;
}

interface FileNodeItemProps {
  node: FileNode;
  level: number;
  selectedPath?: string;
  onFileSelect: (path: string) => void;
  searchTerm: string;
}

// Get icon for file based on extension
function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    ts: "📘",
    tsx: "⚛️",
    js: "📜",
    jsx: "⚛️",
    json: "📋",
    yaml: "⚙️",
    yml: "⚙️",
    md: "📝",
    txt: "📄",
    env: "🔐",
    gitignore: "🚫",
    dockerfile: "🐳",
  };
  return iconMap[ext || ""] || "📄";
}

function FileNodeItem({
  node,
  level,
  selectedPath,
  onFileSelect,
  searchTerm,
}: FileNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const hasMatchingChild = (n: FileNode): boolean => {
    if (n.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
    if (n.children) {
      return n.children.some((child) => hasMatchingChild(child));
    }
    return false;
  };

  // Hide nodes that don't match search
  const isVisible = searchTerm === "" || hasMatchingChild(node);
  if (!isVisible) return null;

  const isSelected = selectedPath === node.path;
  const isFolder = node.type === "folder";

  const handleClick = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node.path);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm
          ${isSelected ? "bg-accent/80 font-medium" : ""}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {isFolder ? (
          <span className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        ) : (
          <span className="w-4" />
        )}

        {isFolder ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500" />
          )
        ) : (
          <span className="text-sm">{getFileIcon(node.name)}</span>
        )}

        <span className="text-sm truncate">{node.name}</span>
      </div>

      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileNodeItem
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onFileSelect={onFileSelect}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ tree, selectedPath, onFileSelect }: FileTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {tree.map((node) => (
          <FileNodeItem
            key={node.path}
            node={node}
            level={0}
            selectedPath={selectedPath}
            onFileSelect={onFileSelect}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </div>
  );
}
