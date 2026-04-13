/**
 * Vertex AI Agent Engine — Sessions API client
 *
 * Provides conversation persistence via Google Cloud's Vertex AI Sessions.
 * Each session stores a chronological list of events (user/assistant messages).
 *
 * Project: machinemates
 * Reasoning Engine: 1012510021449154560 (engie-genie-agent)
 * Location: us-central1
 */
import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT ?? 'machinemates';
const LOCATION = process.env.VERTEX_LOCATION ?? 'us-central1';
const REASONING_ENGINE_ID = process.env.VERTEX_REASONING_ENGINE_ID ?? '1012510021449154560';

const BASE_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/reasoningEngines/${REASONING_ENGINE_ID}`;

let authClient: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  if (!authClient) {
    // Support GOOGLE_APPLICATION_CREDENTIALS_JSON for serverless (Vercel)
    const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (credsJson) {
      const credentials = JSON.parse(credsJson);
      authClient = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } else {
      // Falls back to ADC (local dev, GOOGLE_APPLICATION_CREDENTIALS file)
      authClient = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    }
  }
  return authClient;
}

async function getAccessToken(): Promise<string> {
  const client = await getAuth().getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token ?? '';
}

async function vertexFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const body = await res.text();
  if (!res.ok) {
    console.error(`[vertex-sessions] ${res.status} ${path}:`, body);
    throw new Error(`Vertex AI Sessions error ${res.status}: ${body}`);
  }
  return body ? JSON.parse(body) : {};
}

// ── Session CRUD ───────────────────────────────────────────────────

export interface VertexSession {
  name: string;
  createTime: string;
  updateTime: string;
  userId?: string;
  expireTime?: string;
}

/** Create a new session for a given user */
export async function createSession(
  userId: string,
  sessionId?: string,
): Promise<VertexSession> {
  const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
  const result = await vertexFetch(`/sessions${query}`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });

  // Operation is async — poll for completion
  const op = result as { name: string };
  if (op.name?.includes('/operations/')) {
    return pollOperation<VertexSession>(op.name);
  }
  return result as VertexSession;
}

/** Get an existing session */
export async function getSession(sessionId: string): Promise<VertexSession | null> {
  try {
    return (await vertexFetch(`/sessions/${sessionId}`)) as VertexSession;
  } catch {
    return null;
  }
}

/** List sessions for a user */
export async function listSessions(userId?: string): Promise<VertexSession[]> {
  const filter = userId ? `?filter=user_id="${userId}"` : '';
  const result = (await vertexFetch(`/sessions${filter}`)) as { sessions?: VertexSession[] };
  return result.sessions ?? [];
}

/** Delete a session */
export async function deleteSession(sessionId: string): Promise<void> {
  await vertexFetch(`/sessions/${sessionId}`, { method: 'DELETE' });
}

// ── Events (message persistence) ──────────────────────────────────

export interface SessionEvent {
  name?: string;
  author: 'user' | 'agent';
  content: { parts: Array<{ text: string }> };
  invocationId: string;
  timestamp: string;
}

/** Append a message event to the session */
export async function appendEvent(
  sessionId: string,
  author: 'user' | 'agent',
  text: string,
  invocationId: string,
): Promise<void> {
  await vertexFetch(`/sessions/${sessionId}:appendEvent`, {
    method: 'POST',
    body: JSON.stringify({
      author,
      content: { parts: [{ text }] },
      invocationId,
      timestamp: new Date().toISOString(),
    }),
  });
}

/** Get all events in a session (conversation history) */
export async function getSessionEvents(sessionId: string): Promise<SessionEvent[]> {
  const result = (await vertexFetch(`/sessions/${sessionId}/events`)) as {
    sessionEvents?: SessionEvent[];
  };
  return result.sessionEvents ?? [];
}

// ── Helper: poll long-running operation ───────────────────────────

async function pollOperation<T>(operationName: string, maxAttempts = 20): Promise<T> {
  // Extract just the path after the base
  const fullUrl = operationName.startsWith('http')
    ? operationName
    : `https://${LOCATION}-aiplatform.googleapis.com/v1/${operationName}`;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const token = await getAccessToken();
    const res = await fetch(fullUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const op = (await res.json()) as { done?: boolean; response?: T; error?: unknown };
    if (op.done) {
      if (op.error) throw new Error(`Operation failed: ${JSON.stringify(op.error)}`);
      return op.response as T;
    }
  }
  throw new Error(`Operation timed out: ${operationName}`);
}
