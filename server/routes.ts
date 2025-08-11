import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateToken, authenticateToken } from "./auth";
import { insertUserSchema, insertTransactionSchema, insertInvestmentSchema, insertGoalSchema, loginSchema } from "@shared/schema";
import { spawn } from "child_process";
import multer from "multer";
import csvParser from "csv-parser";
import { Readable } from "stream";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Generate token
      const token = generateToken(user.id);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !await verifyPassword(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate token
      const token = generateToken(user.id);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getUserTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const transactionData = insertTransactionSchema.parse({ ...req.body, userId });
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.put("/api/transactions/:id", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const updates = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, userId, updates);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete("/api/transactions/:id", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const success = await storage.deleteTransaction(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Investment routes
  app.get("/api/investments", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const investments = await storage.getUserInvestments(userId);
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  app.post("/api/investments", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const investmentData = insertInvestmentSchema.parse({ ...req.body, userId });
      const investment = await storage.createInvestment(investmentData);
      res.json(investment);
    } catch (error) {
      res.status(400).json({ message: "Invalid investment data" });
    }
  });

  app.put("/api/investments/:id", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const updates = insertInvestmentSchema.partial().parse(req.body);
      const investment = await storage.updateInvestment(id, userId, updates);
      
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      
      res.json(investment);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete("/api/investments/:id", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const success = await storage.deleteInvestment(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Investment not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete investment" });
    }
  });

  // Goals routes
  app.get("/api/goals", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const goals = await storage.getUserGoals(userId);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const goalData = insertGoalSchema.parse({ ...req.body, userId });
      const goal = await storage.createGoal(goalData);
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid goal data" });
    }
  });

  app.put("/api/goals/:id", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const updates = insertGoalSchema.partial().parse(req.body);
      const goal = await storage.updateGoal(id, userId, updates);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete("/api/goals/:id", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const success = await storage.deleteGoal(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/spending", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      
      const pythonProcess = spawn('python3', ['server/analytics.py', 'analyze_spending', userId]);
      let result = '';
      
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const analytics = JSON.parse(result);
            res.json(analytics);
          } catch (error) {
            res.status(500).json({ message: "Failed to parse analytics data" });
          }
        } else {
          res.status(500).json({ message: "Analytics processing failed" });
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate analytics" });
    }
  });

  app.get("/api/analytics/tips", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      
      const pythonProcess = spawn('python3', ['server/analytics.py', 'generate_tips', userId]);
      let result = '';
      
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            const tips = JSON.parse(result);
            
            // Save tips to database
            for (const tip of tips) {
              await storage.createSavingsTip({
                userId,
                category: tip.category,
                recommendation: tip.recommendation,
                potentialSavings: tip.potential_savings,
                confidence: tip.confidence,
                isActive: true,
              });
            }
            
            res.json(tips);
          } catch (error) {
            res.status(500).json({ message: "Failed to parse tips data" });
          }
        } else {
          res.status(500).json({ message: "Tips generation failed" });
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate tips" });
    }
  });

  app.get("/api/analytics/savings-tips", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const tips = await storage.getUserSavingsTips(userId);
      res.json(tips);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch savings tips" });
    }
  });

  // CSV upload route
  app.post("/api/transactions/upload", authenticateToken, upload.single('csvFile'), async (req, res) => {
    try {
      const userId = (req as any).userId;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const csvData = req.file.buffer.toString('utf-8');
      
      const pythonProcess = spawn('python3', ['server/analytics.py', 'process_csv', userId, csvData]);
      let result = '';
      
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      pythonProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            const processResult = JSON.parse(result);
            
            if (processResult.error) {
              return res.status(400).json({ message: processResult.error });
            }
            
            // Process and save transactions
            const stream = Readable.from([csvData]);
            const transactions = [];
            
            stream
              .pipe(csvParser())
              .on('data', async (row) => {
                try {
                  // Auto-categorize and save transaction
                  const description = row.description || row.memo || row.transaction || 'Unknown';
                  const amount = Math.abs(parseFloat(row.amount || row.debit || row.credit || 0));
                  const date = row.date || row.transaction_date || row.posted_date || new Date().toISOString().split('T')[0];
                  const type = amount > 0 ? 'expense' : 'income';
                  
                  // Simple categorization
                  let category = 'Other';
                  const desc = description.toLowerCase();
                  if (desc.includes('food') || desc.includes('restaurant')) category = 'Food & Dining';
                  else if (desc.includes('gas') || desc.includes('uber')) category = 'Transportation';
                  else if (desc.includes('amazon') || desc.includes('store')) category = 'Shopping';
                  else if (desc.includes('electric') || desc.includes('utility')) category = 'Bills & Utilities';
                  
                  const transaction = await storage.createTransaction({
                    userId,
                    description,
                    amount,
                    category,
                    type,
                    date,
                  });
                  
                  transactions.push(transaction);
                } catch (error) {
                  // Skip invalid rows
                }
              })
              .on('end', () => {
                res.json({
                  ...processResult,
                  transactions_saved: transactions.length,
                });
              });
            
          } catch (error) {
            res.status(500).json({ message: "Failed to process CSV data" });
          }
        } else {
          res.status(500).json({ message: "CSV processing failed" });
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload CSV" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
