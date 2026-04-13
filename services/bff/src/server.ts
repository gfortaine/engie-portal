import http from 'node:http';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { appRouter } from './routers';
import { extractAuthContext } from './middleware/auth';

const handler = createHTTPHandler({
  router: appRouter,
  createContext: ({ req }) => {
    try {
      const auth = extractAuthContext(req);
      return { auth };
    } catch {
      return { auth: null };
    }
  },
});

const PORT = Number(process.env['PORT'] ?? 4000);

const server = http.createServer((req, res) => {
  // CORS headers for dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Strip /api/trpc prefix for tRPC handler
  if (req.url?.startsWith('/api/trpc')) {
    req.url = req.url.replace('/api/trpc', '');
  }

  handler(req, res);
});

server.listen(PORT, () => {
  console.log(`🚀 BFF server running on http://localhost:${PORT}`);
});
