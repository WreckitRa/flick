// Load environment variables FIRST, before any imports that use them
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './server';
import { createContext } from './context';
import type { IncomingMessage, ServerResponse } from 'http';

const PORT = process.env.PORT || 3000;

// Helper to set CORS headers
function setCORSHeaders(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  console.log(`[CORS] Origin: ${origin || 'none'}, Method: ${req.method}, URL: ${req.url}`);

  const allowedOrigins = [
    'http://localhost:3001',
    'http://localhost:3000',
    process.env.ADMIN_URL,
    process.env.MOBILE_API_URL,
  ].filter(Boolean);

  // Set CORS headers - must specify origin when credentials is true
  if (origin) {
    // In development, allow localhost origins
    if (
      process.env.NODE_ENV === 'development' ||
      allowedOrigins.includes(origin) ||
      origin.includes('localhost')
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      console.log(`[CORS] ✓ Allowed: ${origin}`);
    } else {
      console.log(`[CORS] ✗ Rejected: ${origin}`);
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log(`[CORS] ✓ No origin, allowing all`);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

// Create tRPC server
const server = createHTTPServer({
  router: appRouter,
  createContext: async (opts) => {
    console.log(`[tRPC] Context: ${opts.req.method} ${opts.req.url}`);
    setCORSHeaders(opts.req, opts.res);
    return await createContext(opts);
  },
});

// Handle OPTIONS at HTTP level BEFORE tRPC processes
// Use prependListener so it ALWAYS runs before tRPC's handler
server.prependListener('request', (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === 'OPTIONS') {
    console.log('[HTTP] ✓ OPTIONS preflight - handling and ending response');
    setCORSHeaders(req, res);
    res.writeHead(200);
    res.end();
    // Response ended, tRPC handlers won't process this
    return;
  }
  // For non-OPTIONS, let tRPC handle it (don't interfere)
  console.log(`[HTTP] → ${req.method} ${req.url} - passing to tRPC`);
});

server.listen(PORT, () => {
  console.log(`🚀 Flick Backend running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/trpc/health`);
});

export { appRouter };
export type { AppRouter } from './server';
