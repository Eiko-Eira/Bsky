import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { botManager } from "./botManager";

import CryptoJS from 'crypto-js';

// Decryption Helper
function decryptPassword(encryptedStr: string) {
  const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'development_key_replace_in_aws_prod';
  const bytes = CryptoJS.AES.decrypt(encryptedStr, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Check which bots are running
  app.get("/api/bots", (req, res) => {
    res.json({ activeIds: botManager.getActiveBots() });
  });

  // Deploy a new bot to the AWS EC2 worker node
  app.post("/api/deploy-bot", async (req, res) => {
    try {
      const config = req.body;
      
      // Basic validation
      if (!config.handle || !config.appPassword || !config.keywords) {
        return res.status(400).json({ error: "Missing required configuration parameters." });
      }

      // Decrypt password correctly inside the secured AWS boundary
      config.appPassword = decryptPassword(config.appPassword);

      await botManager.deployBot(config);
      
      res.json({ status: "success", message: "Bot deployment registered and started." });
    } catch (error: any) {
      console.error("Bot Deployment Failed:", error);
      res.status(500).json({ error: error.message || "Failed to start bot. Check your app password." });
    }
  });

  // Stop a bot safely
  app.post("/api/stop-bot", (req, res) => {
    botManager.stopBot(req.body.id);
    res.json({ status: "success" });
  });

  // Update a bot
  app.post("/api/update-bot", async (req, res) => {
    const config = req.body;
    if (!config.id || !config.keywords) {
      return res.status(400).json({ error: "Missing bot ID or configurations." });
    }
    
    config.appPassword = decryptPassword(config.appPassword);
    
    await botManager.updateBot(config.id, config);
    res.json({ status: "success" });
  });

  // Fetch bot logs
  app.get("/api/logs/:id", (req, res) => {
    const logs = botManager.getLogs(req.params.id);
    res.json({ logs });
  });

  // Boot Hydration Routine (Mocked for safety until Service Account added)
  // When upgrading to prod, load firebase-admin and replace this.
  function runAwsRehydration() {
    console.log("[SYSTEM BOOT] Commencing DB check for active bots...");
    console.log("[SYSTEM HYDRATION]: Requires isolated firebase-admin Service Account. Scaled temporarily down.");
  }
  runAwsRehydration();

  // Global Error Handler to keep Node alive
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: "Internal server error." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
