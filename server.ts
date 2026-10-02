import 'dotenv/config';
import express from 'express';
import os from 'os';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './server/routes';
import { db } from './server/db';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  const HOST = process.env.HOST || '0.0.0.0';

  // Baseline security headers. CSP and HSTS are enabled only in production so
  // Vite's development websocket and hot-reload scripts continue to work.
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; connect-src 'self' https:; font-src 'self' data: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
    }
    next();
  });

  const attempts = new Map<string, { count: number; resetAt: number }>();
  const rateLimit = (limit: number, windowMs: number) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = attempts.get(key);
    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (current.count >= limit) return res.status(429).json({ success: false, error: 'Too many attempts. Please try again later.' });
    current.count += 1;
    next();
  };

  app.use('/api/auth/login', rateLimit(10, 15 * 60 * 1000));
  app.use('/api/auth/register', rateLimit(5, 60 * 60 * 1000));

  // Middleware for body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // REST API Routes
  app.use('/api', apiRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'MarketNexus Full-Stack Engine',
      timestamp: new Date().toISOString(),
      database: db.getRuntimeStatus()
    });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    const networkAddresses = Object.values(os.networkInterfaces())
      .flat()
      .filter((address): address is os.NetworkInterfaceInfo => Boolean(address && !address.internal && address.family === 'IPv4'))
      .map((address) => `http://${address.address}:${PORT}`);

    console.log(`MarketNexus server running on http://localhost:${PORT}`);
    networkAddresses.forEach((address) => console.log(`Network access: ${address}`));
  });
}

startServer();
