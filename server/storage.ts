import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { randomUUID } from "crypto";
import * as schema from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const sqlite = new Database("finsight.db");
const db = drizzle(sqlite, { schema });

// Initialize tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
  
  CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    shares REAL NOT NULL,
    purchase_price REAL NOT NULL,
    current_price REAL NOT NULL,
    purchase_date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
  
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    target_date TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
  
  CREATE TABLE IF NOT EXISTS savings_tips (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    potential_savings REAL NOT NULL,
    confidence REAL NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

export interface IStorage {
  // Users
  getUser(id: string): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  
  // Transactions
  getUserTransactions(userId: string, limit?: number): Promise<schema.Transaction[]>;
  getTransaction(id: string, userId: string): Promise<schema.Transaction | undefined>;
  createTransaction(transaction: schema.InsertTransaction): Promise<schema.Transaction>;
  updateTransaction(id: string, userId: string, transaction: Partial<schema.InsertTransaction>): Promise<schema.Transaction | undefined>;
  deleteTransaction(id: string, userId: string): Promise<boolean>;
  
  // Investments
  getUserInvestments(userId: string): Promise<schema.Investment[]>;
  getInvestment(id: string, userId: string): Promise<schema.Investment | undefined>;
  createInvestment(investment: schema.InsertInvestment): Promise<schema.Investment>;
  updateInvestment(id: string, userId: string, investment: Partial<schema.InsertInvestment>): Promise<schema.Investment | undefined>;
  deleteInvestment(id: string, userId: string): Promise<boolean>;
  
  // Goals
  getUserGoals(userId: string): Promise<schema.Goal[]>;
  getGoal(id: string, userId: string): Promise<schema.Goal | undefined>;
  createGoal(goal: schema.InsertGoal): Promise<schema.Goal>;
  updateGoal(id: string, userId: string, goal: Partial<schema.InsertGoal>): Promise<schema.Goal | undefined>;
  deleteGoal(id: string, userId: string): Promise<boolean>;
  
  // Savings Tips
  getUserSavingsTips(userId: string): Promise<schema.SavingsTip[]>;
  createSavingsTip(tip: Omit<schema.SavingsTip, "id" | "createdAt">): Promise<schema.SavingsTip>;
}

export class SqliteStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<schema.User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: schema.InsertUser): Promise<schema.User> {
    const id = randomUUID();
    const user: schema.User = { ...insertUser, id, createdAt: new Date().toISOString() };
    await db.insert(schema.users).values(user);
    return user;
  }

  // Transactions
  async getUserTransactions(userId: string, limit = 50): Promise<schema.Transaction[]> {
    return await db.select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .orderBy(desc(schema.transactions.date))
      .limit(limit);
  }

  async getTransaction(id: string, userId: string): Promise<schema.Transaction | undefined> {
    const result = await db.select()
      .from(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createTransaction(insertTransaction: schema.InsertTransaction): Promise<schema.Transaction> {
    const id = randomUUID();
    const transaction: schema.Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt: new Date().toISOString() 
    };
    await db.insert(schema.transactions).values(transaction);
    return transaction;
  }

  async updateTransaction(id: string, userId: string, updates: Partial<schema.InsertTransaction>): Promise<schema.Transaction | undefined> {
    await db.update(schema.transactions)
      .set(updates)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, userId)));
    return this.getTransaction(id, userId);
  }

  async deleteTransaction(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(schema.transactions)
      .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, userId)));
    return result.changes > 0;
  }

  // Investments
  async getUserInvestments(userId: string): Promise<schema.Investment[]> {
    return await db.select()
      .from(schema.investments)
      .where(eq(schema.investments.userId, userId))
      .orderBy(desc(schema.investments.createdAt));
  }

  async getInvestment(id: string, userId: string): Promise<schema.Investment | undefined> {
    const result = await db.select()
      .from(schema.investments)
      .where(and(eq(schema.investments.id, id), eq(schema.investments.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createInvestment(insertInvestment: schema.InsertInvestment): Promise<schema.Investment> {
    const id = randomUUID();
    const investment: schema.Investment = { 
      ...insertInvestment, 
      id, 
      createdAt: new Date().toISOString() 
    };
    await db.insert(schema.investments).values(investment);
    return investment;
  }

  async updateInvestment(id: string, userId: string, updates: Partial<schema.InsertInvestment>): Promise<schema.Investment | undefined> {
    await db.update(schema.investments)
      .set(updates)
      .where(and(eq(schema.investments.id, id), eq(schema.investments.userId, userId)));
    return this.getInvestment(id, userId);
  }

  async deleteInvestment(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(schema.investments)
      .where(and(eq(schema.investments.id, id), eq(schema.investments.userId, userId)));
    return result.changes > 0;
  }

  // Goals
  async getUserGoals(userId: string): Promise<schema.Goal[]> {
    return await db.select()
      .from(schema.goals)
      .where(eq(schema.goals.userId, userId))
      .orderBy(desc(schema.goals.createdAt));
  }

  async getGoal(id: string, userId: string): Promise<schema.Goal | undefined> {
    const result = await db.select()
      .from(schema.goals)
      .where(and(eq(schema.goals.id, id), eq(schema.goals.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createGoal(insertGoal: schema.InsertGoal): Promise<schema.Goal> {
    const id = randomUUID();
    const goal: schema.Goal = { 
      ...insertGoal, 
      id, 
      createdAt: new Date().toISOString() 
    };
    await db.insert(schema.goals).values(goal);
    return goal;
  }

  async updateGoal(id: string, userId: string, updates: Partial<schema.InsertGoal>): Promise<schema.Goal | undefined> {
    await db.update(schema.goals)
      .set(updates)
      .where(and(eq(schema.goals.id, id), eq(schema.goals.userId, userId)));
    return this.getGoal(id, userId);
  }

  async deleteGoal(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(schema.goals)
      .where(and(eq(schema.goals.id, id), eq(schema.goals.userId, userId)));
    return result.changes > 0;
  }

  // Savings Tips
  async getUserSavingsTips(userId: string): Promise<schema.SavingsTip[]> {
    return await db.select()
      .from(schema.savingsTips)
      .where(and(eq(schema.savingsTips.userId, userId), eq(schema.savingsTips.isActive, true)))
      .orderBy(desc(schema.savingsTips.confidence));
  }

  async createSavingsTip(tip: Omit<schema.SavingsTip, "id" | "createdAt">): Promise<schema.SavingsTip> {
    const id = randomUUID();
    const savingsTip: schema.SavingsTip = { 
      ...tip, 
      id, 
      createdAt: new Date().toISOString() 
    };
    await db.insert(schema.savingsTips).values(savingsTip);
    return savingsTip;
  }
}

export const storage = new SqliteStorage();
