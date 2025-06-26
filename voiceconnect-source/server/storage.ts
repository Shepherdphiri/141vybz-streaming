import { users, calls, type User, type InsertUser, type Call, type InsertCall } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createCall(call: InsertCall): Promise<Call>;
  getCallsByUser(userId: string): Promise<Call[]>;
  updateCallStatus(callerId: string, calleeId: string, status: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private calls: Map<number, Call>;
  private currentUserId: number;
  private currentCallId: number;

  constructor() {
    this.users = new Map();
    this.calls = new Map();
    this.currentUserId = 1;
    this.currentCallId = 1;
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
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createCall(insertCall: InsertCall): Promise<Call> {
    const id = this.currentCallId++;
    const call: Call = { 
      ...insertCall, 
      id, 
      duration: insertCall.duration || 0,
      createdAt: new Date() 
    };
    this.calls.set(id, call);
    return call;
  }

  async getCallsByUser(userId: string): Promise<Call[]> {
    return Array.from(this.calls.values())
      .filter(call => call.callerId === userId || call.calleeId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10); // Return last 10 calls
  }

  async updateCallStatus(callerId: string, calleeId: string, status: string): Promise<void> {
    // Find the most recent call between these users
    const call = Array.from(this.calls.values())
      .filter(c => 
        (c.callerId === callerId && c.calleeId === calleeId) ||
        (c.callerId === calleeId && c.calleeId === callerId)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    
    if (call) {
      call.status = status;
      // In a real implementation, you'd also update duration here
      this.calls.set(call.id, call);
    }
  }
}

export const storage = new MemStorage();
