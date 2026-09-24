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
