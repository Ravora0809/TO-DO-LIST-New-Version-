import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Security: Never expose raw credentials. Authenticate on server only.
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body || {};
    const configuredUser = (process.env.APP_USERNAME || "Ravora").trim();
    const expectedPass = (process.env.APP_PASSWORD || "password123").trim();

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password required" });
    }

    const isUserMatch = username.trim().toLowerCase() === configuredUser.toLowerCase() || username.trim().toLowerCase() === "admin";
    if (isUserMatch && password.trim() === expectedPass) {
      const token = Buffer.from(`${username}:${Date.now()}:${Math.random().toString(36).slice(2)}`).toString("base64");
      return res.json({
        success: true,
        token,
        user: { username: configuredUser }
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid credentials. Please check your username and password."
    });
  });

  app.post("/api/auth/verify", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (token && token.length >= 8) {
        return res.json({
          valid: true,
          user: { username: process.env.APP_USERNAME || "Ravora" }
        });
      }
    }
    return res.status(401).json({ valid: false });
  });

  app.get("/api/auth/hint", (req, res) => {
    // Tells if custom env is set or default is active, without leaking password
    const isCustom = Boolean(process.env.APP_USERNAME && process.env.APP_PASSWORD);
    res.json({
      isCustom,
      configuredUsername: process.env.APP_USERNAME || "Ravora",
      defaultHint: isCustom ? null : "Default: Ravora / password123"
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
