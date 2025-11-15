import { nanoid } from "nanoid";

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface Session {
  id: string;
  files: Map<string, string>; // path -> content
  createdAt: Date;
  expiresAt: Date;
  projectName: string;
}

// In-memory session storage with TTL
const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Start the cleanup interval for expired sessions
 * Idempotent - safe to call multiple times
 */
export function startCleanup(): void {
  if (cleanupTimer) {
    return; // Already running
  }

  cleanupTimer = setInterval(() => {
    const now = new Date();
    sessions.forEach((session, sessionId) => {
      if (session.expiresAt < now) {
        sessions.delete(sessionId);
        console.log(
          `[SessionStorage] Cleaned up expired session: ${sessionId}`
        );
      }
    });
  }, CLEANUP_INTERVAL_MS);

  console.log("[SessionStorage] Cleanup interval started");
}

/**
 * Stop the cleanup interval
 * Safe to call multiple times
 */
export function stopCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    console.log("[SessionStorage] Cleanup interval stopped");
  }
}

export function createSession(
  files: GeneratedFile[],
  projectName: string
): string {
  const sessionId = nanoid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

  const fileMap = new Map<string, string>();
  files.forEach((file) => {
    fileMap.set(file.path, file.content);
  });

  sessions.set(sessionId, {
    id: sessionId,
    files: fileMap,
    createdAt: now,
    expiresAt,
    projectName,
  });

  console.log(
    `[SessionStorage] Created session ${sessionId} with ${files.length} files, expires at ${expiresAt.toISOString()}`
  );
  return sessionId;
}

export function getSession(sessionId: string): Session | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  // Check if expired
  if (session.expiresAt < new Date()) {
    sessions.delete(sessionId);
    return undefined;
  }

  return session;
}

export function updateFile(
  sessionId: string,
  path: string,
  content: string
): boolean {
  const session = getSession(sessionId);
  if (!session) return false;

  session.files.set(path, content);
  return true;
}

export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}

export function getSessionStats(): {
  totalSessions: number;
  totalFiles: number;
} {
  let totalFiles = 0;
  sessions.forEach((session) => {
    totalFiles += session.files.size;
  });
  return {
    totalSessions: sessions.size,
    totalFiles,
  };
}
