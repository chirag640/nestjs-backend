import { useState, useEffect } from "react";
import { useWizardStore } from "@/lib/store";
import { FileTree, type FileNode } from "@/components/wizard/FileTree";
import { CodeEditor } from "@/components/wizard/CodeEditor";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Edit3,
  Save,
  Wand2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
  ArrowLeft,
  Code2,
} from "lucide-react";

interface PreviewState {
  sessionId: string | null;
  tree: FileNode[];
  selectedFile: string | null;
  fileContent: string;
  isEditMode: boolean;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  projectName: string;
  totalFiles: number;
}

export default function Step7Preview() {
  const { config } = useWizardStore();
  const projectName = config.projectSetup?.projectName || "nestjs-backend";

  const [state, setState] = useState<PreviewState>({
    sessionId: null,
    tree: [],
    selectedFile: null,
    fileContent: "",
    isEditMode: false,
    isDirty: false,
    isLoading: true,
    error: null,
    projectName,
    totalFiles: 0,
  });

  // Generate project and load file tree on mount
  // ESLint: config is intentionally omitted - we only want to generate once on mount,
  // not re-generate every time config changes (user has already confirmed config in Step 6)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    generateProject();
  }, []);

  const generateProject = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/generate?mode=preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      const { sessionId, projectName: name, totalFiles } = data;

      // Load file tree
      const treeResponse = await fetch(
        `/api/preview/tree?sessionId=${sessionId}`
      );
      if (!treeResponse.ok) {
        throw new Error("Failed to load file tree");
      }

      const treeData = await treeResponse.json();

      setState((prev) => ({
        ...prev,
        sessionId,
        tree: treeData.tree,
        projectName: name,
        totalFiles,
        isLoading: false,
      }));

      // Auto-select first file
      if (treeData.tree.length > 0) {
        const firstFile = findFirstFile(treeData.tree);
        if (firstFile) {
          loadFile(firstFile, sessionId);
        }
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to generate project",
      }));
    }
  };

  const findFirstFile = (nodes: FileNode[]): string | null => {
    for (const node of nodes) {
      if (node.type === "file") return node.path;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const loadFile = async (filePath: string, sessionId?: string) => {
    const sid = sessionId || state.sessionId;
    if (!sid) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/preview/file?sessionId=${sid}&path=${encodeURIComponent(filePath)}`
      );
      if (!response.ok) {
        throw new Error("Failed to load file");
      }

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        selectedFile: filePath,
        fileContent: data.content,
        isDirty: false,
        isLoading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to load file",
      }));
    }
  };

  const handleFileSelect = (filePath: string) => {
    if (state.isDirty) {
      const confirm = window.confirm("You have unsaved changes. Discard them?");
      if (!confirm) return;
    }
    loadFile(filePath);
  };

  const handleContentChange = (newContent: string) => {
    setState((prev) => ({
      ...prev,
      fileContent: newContent,
      isDirty: true,
    }));
  };

  const handleSave = async () => {
    if (!state.sessionId || !state.selectedFile) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/preview/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          path: state.selectedFile,
          content: state.fileContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save file");
      }

      setState((prev) => ({
        ...prev,
        isDirty: false,
        isLoading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to save file",
      }));
    }
  };

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      json: "json",
      md: "markdown",
      yml: "yaml",
      yaml: "yaml",
      css: "css",
      scss: "scss",
      html: "html",
      xml: "xml",
    };
    return languageMap[ext || ""] || "plaintext";
  };

  const handleFormat = async () => {
    if (!state.selectedFile) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/preview/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: state.fileContent,
          language: getLanguageFromFilename(state.selectedFile),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to format code");
      }

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        fileContent: data.formatted,
        isDirty: true,
        isLoading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to format code",
      }));
    }
  };

  const handleDownload = () => {
    if (!state.sessionId) return;
    window.location.href = `/api/preview/download?sessionId=${state.sessionId}`;
  };

  const toggleEditMode = () => {
    setState((prev) => ({ ...prev, isEditMode: !prev.isEditMode }));
  };

  if (state.isLoading && !state.sessionId) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <div>
            <h3 className="font-semibold text-lg">
              Generating your project...
            </h3>
            <p className="text-sm text-muted-foreground">
              This may take a few moments
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { previousStep } = useWizardStore();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Custom Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={previousStep}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold">{state.projectName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {state.totalFiles} files generated
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="ml-2">
                Step 7 of 7
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={state.isEditMode ? "default" : "outline"}
                onClick={toggleEditMode}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {state.isEditMode ? "View Mode" : "Edit Mode"}
              </Button>

              {state.isEditMode && state.isDirty && (
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}

              <Button size="sm" variant="outline" onClick={handleFormat}>
                <Wand2 className="w-4 h-4 mr-2" />
                Format
              </Button>

              <Button size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download ZIP
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden">
        <div className="space-y-4 h-full flex flex-col">
          {/* Success message */}
          {!state.isEditMode && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Your project is ready! Review the code below or download the ZIP
                file to get started.
              </AlertDescription>
            </Alert>
          )}

          {/* Split pane layout */}
          <div className="flex-1 grid grid-cols-[320px,1fr] gap-4 border rounded-lg overflow-hidden">
            {/* Left: File Tree */}
            <FileTree
              tree={state.tree}
              selectedPath={state.selectedFile || undefined}
              onFileSelect={handleFileSelect}
            />

            {/* Right: Code Editor */}
            <div className="bg-background">
              {state.selectedFile ? (
                <CodeEditor
                  value={state.fileContent}
                  language="typescript"
                  fileName={state.selectedFile}
                  readonly={!state.isEditMode}
                  onChange={handleContentChange}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a file to preview
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Session expires in 30 minutes.</strong> Download your
              project before the session expires. Edited files are saved to the
              session and included in the download.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
}
