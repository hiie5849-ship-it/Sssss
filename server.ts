import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './server/routes/auth.js';
import { productsRouter } from './server/routes/products.js';
import { sellersRouter } from './server/routes/sellers.js';
import { ordersRouter } from './server/routes/orders.js';
import { paymentsRouter } from './server/routes/payments.js';
import { adminRouter } from './server/routes/admin.js';
import { notificationsRouter } from './server/routes/notifications.js';
import { zipRouter } from './server/routes/zip.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON and URL-encoded body parsers with generous limits for product photos
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/sellers', sellersRouter);
  app.use('/api', ordersRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api', zipRouter);

  // Health and System Info
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'ZappKart Multi-Vendor Marketplace',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ZappKart Engine] Multi-Vendor Marketplace active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[ZappKart Engine] Fatal startup error:', err);
  process.exit(1);
});
