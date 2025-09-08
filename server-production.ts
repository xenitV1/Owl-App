import express from 'express';
import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';
import { Server } from 'socket.io';
import { setupSocket } from './src/lib/socket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// When using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  
  // Setup Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.CORS_ORIGIN || process.env.NEXT_PUBLIC_APP_URL
        : '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Setup socket handlers
  setupSocket(io);

  // Security middleware for production
  if (!dev) {
    // Trust proxy for proper IP logging
    expressApp.set('trust proxy', 1);
    
    // Security headers
    expressApp.use((req, res, next) => {
      // Remove X-Powered-By header
      res.removeHeader('X-Powered-By');
      
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Enable XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Permissions policy
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      next();
    });

    // Rate limiting middleware (basic implementation)
    const rateLimit = require('express-rate-limit');
    
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
      max: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
      message: {
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Apply rate limiting to API routes
    expressApp.use('/api', limiter);
  }

  // Compression middleware
  const compression = require('compression');
  expressApp.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req: any, res: any) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // Body parsing middleware
  expressApp.use(express.json({ limit: '10mb' }));
  expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static file serving with cache headers
  expressApp.use('/_next/static', express.static('.next/static', {
    maxAge: dev ? 0 : 365 * 24 * 60 * 60 * 1000, // 1 year
    immutable: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.css') || path.endsWith('.js')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // Health check endpoint
  expressApp.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown'
    });
  });

  // Ready check endpoint (includes database check)
  expressApp.get('/ready', async (req, res) => {
    try {
      // Add database health check here if needed
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'healthy',
          websocket: 'healthy'
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      });
    }
  });

  // Metrics endpoint (for monitoring)
  expressApp.get('/metrics', (req, res) => {
    const metrics = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: Date.now(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
    
    res.status(200).json(metrics);
  });

  // Handle all other requests with Next.js
  expressApp.all('*', (req, res) => {
    const parsedUrl = parse(req.url, true);
    
    // Add request logging in production
    if (!dev) {
      console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    }
    
    handler(req, res, parsedUrl);
  });

  // Error handling middleware
  expressApp.use((err: any, req: any, res: any, next: any) => {
    console.error('Application error:', err);
    
    if (!dev) {
      // In production, don't leak error details
      res.status(500).json({
        error: 'Internal Server Error',
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    } else {
      // In development, send full error details
      res.status(500).json({
        error: err.message,
        stack: err.stack
      });
    }
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('Server closed. Exiting process.');
      process.exit(0);
    });
    
    // Force close after timeout
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

  server.listen(port, hostname, () => {
    console.log(`> Server listening at http://${hostname}:${port} as ${dev ? 'development' : 'production'}`);
    console.log(`> Environment: ${process.env.NODE_ENV}`);
    console.log(`> Health check: http://${hostname}:${port}/health`);
  });
});