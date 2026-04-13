/**
 * /api/sessions — Vertex AI Session management endpoint
 *
 * POST   — Create new session { userId }
 * GET    — List sessions (query: ?userId=xxx) or get session history (?sessionId=xxx)
 * DELETE — Delete session { sessionId }
 * PATCH  — Generate a short title for a session { sessionId, userMessage }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createSession,
  getSession,
  getSessionEvents,
  listSessions,
  deleteSession,
  updateSession,
} from '../lib/vertex-sessions.js';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      const { userId, sessionId } = req.body as { userId: string; sessionId?: string };
      if (!userId) return res.status(400).json({ error: 'userId required' });

      const session = await createSession(userId, sessionId);
      // Extract session ID from resource name
      const parts = session.name.split('/');
      const id = parts[parts.length - 1];
      return res.json({ sessionId: id, ...session });
    }

    if (req.method === 'GET') {
      const { sessionId, userId } = req.query as { sessionId?: string; userId?: string };

      if (sessionId) {
        // Get session + events (conversation history)
        const [session, events] = await Promise.all([
          getSession(sessionId),
          getSessionEvents(sessionId),
        ]);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        return res.json({ session, events });
      }

      // List sessions for user
      const sessions = await listSessions(userId);
      return res.json({ sessions });
    }

    if (req.method === 'DELETE') {
      const { sessionId } = req.body as { sessionId: string };
      if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
      await deleteSession(sessionId);
      return res.json({ deleted: true });
    }

    if (req.method === 'PATCH') {
      const { sessionId, userMessage } = req.body as { sessionId?: string; userMessage: string };
      if (!userMessage) return res.status(400).json({ error: 'userMessage required' });

      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      let title: string;

      if (!apiKey) {
        title = userMessage.length > 30 ? userMessage.slice(0, 27) + '…' : userMessage;
      } else {
        const google = createGoogleGenerativeAI({ apiKey });
        const { text } = await generateText({
          model: google('gemini-3.1-flash-lite-preview'),
          prompt: `Génère un titre court (3-5 mots max, en français) pour cette conversation avec un assistant énergie. Pas de guillemets, pas de ponctuation finale.\n\nMessage: "${userMessage}"`,
          maxTokens: 20,
        });
        title = text.trim();
      }

      // Persist title as displayName on the Vertex AI session
      if (sessionId && title) {
        try {
          await updateSession(sessionId, { displayName: title });
        } catch (e) {
          console.warn('[api/sessions] Failed to update session displayName:', e);
        }
      }

      return res.json({ title });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[api/sessions] Error:', error);
    return res.status(500).json({
      error: 'Session operation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
