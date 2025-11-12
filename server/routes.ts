import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // This wizard application is primarily frontend-focused
  // All configuration state is managed client-side with Zustand + localStorage
  // Backend routes can be added here for future features like:
  // - Saving configurations to a database
  // - Sharing configurations via links
  // - Template management

  const httpServer = createServer(app);

  return httpServer;
}
