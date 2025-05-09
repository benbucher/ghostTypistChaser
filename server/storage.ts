import { users, type User, type InsertUser, type HighScore } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getHighScore(): Promise<number | undefined>;
  saveHighScore(score: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private highScore: number | undefined;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.highScore = 0;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getHighScore(): Promise<number | undefined> {
    return this.highScore;
  }
  
  async saveHighScore(score: number): Promise<void> {
    if (!this.highScore || score > this.highScore) {
      this.highScore = score;
    }
  }
}

export const storage = new MemStorage();
