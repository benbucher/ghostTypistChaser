import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get the high score
  app.get('/api/highscore', async (req, res) => {
    try {
      const highScore = await storage.getHighScore();
      res.json({ highScore: highScore || 0 });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get high score' });
    }
  });

  // Update the high score
  app.post('/api/highscore', async (req, res) => {
    try {
      const { score } = req.body;
      
      if (typeof score !== 'number' || score < 0) {
        return res.status(400).json({ message: 'Invalid score' });
      }
      
      const currentHighScore = await storage.getHighScore();
      
      // Only update if the new score is higher
      if (!currentHighScore || score > currentHighScore) {
        await storage.saveHighScore(score);
        return res.json({ highScore: score });
      }
      
      res.json({ highScore: currentHighScore });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update high score' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
