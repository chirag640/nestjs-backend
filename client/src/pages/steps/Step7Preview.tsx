import { useState, useEffect } from "react";
import { useWizardStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { FileTree, type FileNode } from "@/components/wizard/FileTree";
import {
  CodeEditor,
  type EditorDiagnostic,
} from "@/components/wizard/CodeEditor";
import { DiffEditor } from "@/components/wizard/DiffEditor";
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
  Code2,
  ArrowLeft,
  RotateCcw,
  Undo2,
  Redo2,
  Bug,
  Zap,
  GitCompare,
} from "lucide-react";

interface PreviewState {
  sessionId: string | null;
  tree: FileNode[];
  selectedFile: string | null;
  fileContent: string;
  originalContent: string;
  isEditMode: boolean;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
  error: string | null;
  errorDetails?: {
    error?: string;
    message?: string;
    errors?: Array<{
      location: string;
      path: string;
      issue: string;
      suggestion: string;
      value?: string;
      code?: string;
    }>;
    warnings?: any[];
    hint?: string;
    technicalDetails?: any;
  };
  projectName: string;
  totalFiles: number;
  diagnostics: EditorDiagnostic[];
  showDiff: boolean;
  isFormatting: boolean;
  isLinting: boolean;
  isTypechecking: boolean;
  isSaving: boolean;
}

export default function Step7Preview() {
  const { config, previousStep } = useWizardStore();
  const { toast } = useToast();
  const projectName = config.projectSetup?.projectName || "nestjs-backend";

  const [state, setState] = useState<PreviewState>({
    sessionId: null,
    tree: [],
    selectedFile: null,
    fileContent: "",
    originalContent: "",
    isEditMode: false,
    isDirty: false,
    canUndo: false,
    canRedo: false,
    isLoading: true,
    error: null,
    projectName,
    totalFiles: 0,
    diagnostics: [],
    showDiff: false,
    isFormatting: false,
    isLinting: false,
    isTypechecking: false,
    isSaving: false,
  });

  // Generate project on mount
  useEffect(() => {
    generateProject();
  }, []);

  // Show toast for errors
  useEffect(() => {
    if (state.error && !state.sessionId) {
      // Only show toast for generation errors, not file operation errors
    }
  }, [state.error, state.sessionId]);

  const generateProject = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/generate?mode=preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Network Error",
          message: response.statusText,
          errors: [],
        }));

        // Store detailed error data for display
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorData.message || errorData.error || "Generation failed",
          errorDetails: errorData,
        }));
        return;
      }

      const data = await response.json();
      const { sessionId, projectName: name, totalFiles } = data;

      // Load file tree
      const treeResponse = await fetch(
        `/api/preview/tree?sessionId=${sessionId}`,
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
      const errorMsg = error.message || "Failed to generate project";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }));

      // Show toast notification
      toast({
        title: "Generation Failed",
        description: errorMsg,
        variant: "destructive",
      });
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
        `/api/preview/file?sessionId=${sid}&path=${encodeURIComponent(filePath)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to load file");
      }

      const data = await response.json();

      // Load original content for diff
      const diffResponse = await fetch(
        `/api/preview/diff?sessionId=${sid}&path=${encodeURIComponent(filePath)}`,
      );
      const diffData = diffResponse.ok ? await diffResponse.json() : null;

      setState((prev) => ({
        ...prev,
        selectedFile: filePath,
        fileContent: data.content,
        originalContent: diffData?.original || data.content,
        isDirty: data.dirty || false,
        canUndo: data.canUndo || false,
        canRedo: data.canRedo || false,
        isLoading: false,
        diagnostics: [],
        showDiff: false,
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

    setState((prev) => ({ ...prev, isSaving: true, error: null }));

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
        canUndo: true,
        isSaving: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: error.message || "Failed to save file",
      }));
    }
  };

  const handleFormat = async () => {
    if (!state.selectedFile) return;

    setState((prev) => ({ ...prev, isFormatting: true, error: null }));

    try {
      const response = await fetch("/api/preview/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: state.fileContent,
          language:
            state.selectedFile.endsWith(".ts") ||
            state.selectedFile.endsWith(".tsx")
              ? "typescript"
              : "json",
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
        isFormatting: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isFormatting: false,
        error: error.message || "Failed to format code",
      }));
    }
  };

  const handleLint = async () => {
    if (!state.selectedFile) return;

    setState((prev) => ({ ...prev, isLinting: true, error: null }));

    try {
      const response = await fetch("/api/preview/lint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: state.fileContent,
          filePath: state.selectedFile,
          fix: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to lint code");
      }

      const data = await response.json();
      const diagnostics: EditorDiagnostic[] = data.diagnostics.map(
        (d: any) => ({
          line: d.line,
          column: d.column,
          message: d.message,
          severity: d.severity === 2 ? "error" : "warning",
          source: "eslint",
        }),
      );

      setState((prev) => ({
        ...prev,
        diagnostics,
        isLinting: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLinting: false,
        error: error.message || "Failed to lint code",
      }));
    }
  };

  const handleTypecheck = async () => {
    if (!state.sessionId) return;

    setState((prev) => ({ ...prev, isTypechecking: true, error: null }));

    try {
      const response = await fetch("/api/preview/typecheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to typecheck project");
      }

      const data = await response.json();

      // Filter diagnostics for current file
      const fileDiagnostics: EditorDiagnostic[] = data.diagnostics
        .filter((d: any) => d.file === state.selectedFile)
        .map((d: any) => ({
          line: d.line || 1,
          column: d.column || 1,
          message: d.message,
          severity:
            d.category === "error"
              ? "error"
              : d.category === "warning"
                ? "warning"
                : "info",
          source: "typescript",
        }));

      setState((prev) => ({
        ...prev,
        diagnostics: fileDiagnostics,
        isTypechecking: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isTypechecking: false,
        error: error.message || "Failed to typecheck project",
      }));
    }
  };

  const handleAutoFix = async () => {
    if (!state.selectedFile) return;

    setState((prev) => ({ ...prev, isFormatting: true, error: null }));

    try {
      // First run ESLint with fix
      const lintResponse = await fetch("/api/preview/lint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: state.fileContent,
          filePath: state.selectedFile,
          fix: true,
        }),
      });

      if (!lintResponse.ok) {
        throw new Error("Failed to auto-fix");
      }

      const lintData = await lintResponse.json();
      let fixedCode = lintData.fixedCode || state.fileContent;

      // Then run Prettier
      const formatResponse = await fetch("/api/preview/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: fixedCode,
          language:
            state.selectedFile.endsWith(".ts") ||
            state.selectedFile.endsWith(".tsx")
              ? "typescript"
              : "json",
        }),
      });

      if (formatResponse.ok) {
        const formatData = await formatResponse.json();
        fixedCode = formatData.formatted;
      }

      setState((prev) => ({
        ...prev,
        fileContent: fixedCode,
        isDirty: true,
        isFormatting: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isFormatting: false,
        error: error.message || "Failed to auto-fix code",
      }));
    }
  };

  const handleUndo = async () => {
    if (!state.sessionId || !state.selectedFile) return;

    try {
      const response = await fetch("/api/preview/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          path: state.selectedFile,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to undo");
      }

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        fileContent: data.content,
        canUndo: data.canUndo,
        canRedo: data.canRedo,
        isDirty: true,
      }));
    } catch (error: any) {
      console.error("Undo failed:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Failed to undo",
      }));
    }
  };

  const handleRedo = async () => {
    if (!state.sessionId || !state.selectedFile) return;

    try {
      const response = await fetch("/api/preview/redo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          path: state.selectedFile,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to redo");
      }

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        fileContent: data.content,
        canUndo: data.canUndo,
        canRedo: data.canRedo,
        isDirty: true,
      }));
    } catch (error: any) {
      console.error("Redo failed:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Failed to redo",
      }));
    }
  };

  const handleReset = async () => {
    if (!state.sessionId || !state.selectedFile) return;

    const confirm = window.confirm(
      "Reset file to original content? This cannot be undone.",
    );
    if (!confirm) return;

    try {
      const response = await fetch("/api/preview/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          path: state.selectedFile,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset file");
      }

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        fileContent: data.content,
        isDirty: false,
        diagnostics: [],
      }));
    } catch (error: any) {
      console.error("Reset failed:", error);
      setState((prev) => ({
        ...prev,
        error: error.message || "Failed to reset file",
      }));
    }
  };

  const toggleEditMode = () => {
    setState((prev) => ({ ...prev, isEditMode: !prev.isEditMode }));
  };

  const toggleDiff = () => {
    setState((prev) => ({ ...prev, showDiff: !prev.showDiff }));
  };

  const handleDownload = () => {
    if (!state.sessionId) return;
    window.location.href = `/api/preview/download?sessionId=${state.sessionId}`;
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

  if (state.error && !state.sessionId) {
    const errorDetails = state.errorDetails;
    const hasDetailedErrors =
      errorDetails?.errors && errorDetails.errors.length > 0;

    return (
      <div className="flex items-center justify-center min-h-[600px] p-6">
        <div className="max-w-4xl w-full space-y-4">
          {/* Main Error Alert */}
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-lg">
                  {errorDetails?.error || "Generation Failed"}
                </p>
                <p className="text-sm">
                  {errorDetails?.message || state.error}
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Detailed Error List */}
          {hasDetailedErrors && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Bug className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-base">
                  {errorDetails.errors!.length} Error
                  {errorDetails.errors!.length !== 1 ? "s" : ""} Found
                </h3>
              </div>

              <div className="space-y-3">
                {errorDetails.errors!.map((error, index) => (
                  <div
                    key={index}
                    className="bg-background border border-destructive/30 rounded-md p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        {/* Location */}
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {error.location}
                          </code>
                        </div>

                        {/* Path */}
                        {error.path && error.path !== "unknown" && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Path:</span>{" "}
                            <code className="bg-muted px-1.5 py-0.5 rounded">
                              {error.path}
                            </code>
                          </div>
                        )}

                        {/* Issue */}
                        <div className="text-sm">
                          <span className="font-medium text-destructive">
                            Issue:
                          </span>{" "}
                          {error.issue}
                        </div>

                        {/* Value */}
                        {error.value && error.value !== "N/A" && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Current value:</span>{" "}
                            <code className="bg-muted px-1.5 py-0.5 rounded">
                              {error.value}
                            </code>
                          </div>
                        )}

                        {/* Suggestion */}
                        {error.suggestion && (
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2 mt-2">
                            <div className="flex items-start gap-2">
                              <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-blue-700 dark:text-blue-300">
                                <span className="font-medium">Fix:</span>{" "}
                                {error.suggestion}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hint */}
          {errorDetails?.hint && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>💡 Hint:</strong> {errorDetails.hint}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="default" onClick={previousStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back to Review
            </Button>
            <Button
              variant="default"
              size="default"
              onClick={generateProject}
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Retry Generation
            </Button>
          </div>

          {/* Common Issues Reference */}
          {!hasDetailedErrors && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Common issues:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1.5 text-muted-foreground">
                  <li>
                    <strong>Model names</strong> must be PascalCase (e.g.,{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      User
                    </code>
                    ,{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      BlogPost
                    </code>
                    )
                  </li>
                  <li>
                    <strong>Field names</strong> must be camelCase (e.g.,{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      firstName
                    </code>
                    ,{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                      createdAt
                    </code>
                    )
                  </li>
                  <li>
                    <strong>Required fields</strong> must be filled in all
                    previous steps
                  </li>
                  <li>
                    <strong>Relationships</strong> must reference existing model
                    names
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Project info */}
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
                    {state.totalFiles} files • Step 7 of 7
                  </p>
                </div>
              </div>
              {state.isEditMode && (
                <Badge
                  variant="outline"
                  className="bg-blue-500/10 text-blue-600 border-blue-600/30"
                >
                  Edit Mode
                </Badge>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={state.isEditMode ? "default" : "outline"}
                onClick={toggleEditMode}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {state.isEditMode ? "View Mode" : "Edit Mode"}
              </Button>

              {state.isEditMode && (
                <>
                  {state.canUndo && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleUndo}
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo2 className="w-4 h-4" />
                    </Button>
                  )}
                  {state.canRedo && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRedo}
                      title="Redo (Ctrl+Y)"
                    >
                      <Redo2 className="w-4 h-4" />
                    </Button>
                  )}

                  {state.isDirty && (
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={state.isSaving}
                    >
                      {state.isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleFormat}
                    disabled={state.isFormatting}
                  >
                    {state.isFormatting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    Format
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAutoFix}
                    disabled={state.isFormatting}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Auto-Fix
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLint}
                    disabled={state.isLinting}
                  >
                    {state.isLinting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Bug className="w-4 h-4 mr-2" />
                    )}
                    Lint
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTypecheck}
                    disabled={state.isTypechecking}
                  >
                    {state.isTypechecking ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Typecheck
                  </Button>

                  {state.isDirty && (
                    <>
                      <Button size="sm" variant="outline" onClick={toggleDiff}>
                        <GitCompare className="w-4 h-4 mr-2" />
                        {state.showDiff ? "Hide Diff" : "Show Diff"}
                      </Button>

                      <Button size="sm" variant="outline" onClick={handleReset}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </>
                  )}
                </>
              )}

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
                Your project is ready! Enable Edit Mode to modify files, or
                download the ZIP to get started.
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {state.error && state.sessionId && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
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

            {/* Right: Editor or Diff */}
            <div className="bg-background">
              {state.selectedFile ? (
                state.showDiff ? (
                  <DiffEditor
                    original={state.originalContent}
                    modified={state.fileContent}
                    fileName={state.selectedFile}
                    onClose={toggleDiff}
                  />
                ) : (
                  <CodeEditor
                    value={state.fileContent}
                    language="typescript"
                    fileName={state.selectedFile}
                    readonly={!state.isEditMode}
                    onChange={handleContentChange}
                    diagnostics={state.diagnostics}
                    onSave={handleSave}
                    showSaveIndicator={state.isEditMode}
                    isDirty={state.isDirty}
                  />
                )
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
