// No database storage needed for this wizard application
// All state is managed client-side with Zustand + localStorage

export interface IStorage {
  // Placeholder for future functionality
}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
