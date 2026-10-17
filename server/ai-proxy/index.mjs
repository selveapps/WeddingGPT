import http from 'node:http';
import Anthropic from '@anthropic-ai/sdk';

import { SYSTEM_PROMPT, TOOLS } from './prompt.mjs';

/**
 * WeddingGPT AI proxy.
 *
 * The app sends { messages, context } to POST /v1/chat. This server adds the
 * system prompt, calls Claude, and returns { content, proposal, model }.
 *
 * Why a server at all: an API key shipped inside a mobile app can be extracted
 * by anyone who downloads it. Here it stays in this process's environment.
 *
 * Environment:
 *   ANTHROPIC_API_KEY   required (or any credential the Anthropic SDK resolves)
 *   APP_TOKEN           optional shared token the app sends as X-App-Token
 *   AI_EFFORT           low | medium | high  (default medium - a chat is latency-sensitive)
 *   PORT                default 8787
 *   ALLOWED_ORIGIN      CORS origin for the web build (default *)
 */

const PORT = Number(process.env.PORT ?? 8787);
const APP_TOKEN = process.env.APP_TOKEN || null;
const EFFORT = process.env.AI_EFFORT || 'medium';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const MODEL = 'claude-opus-5';

const LIMITS = {
  bodyBytes: 64 * 1024,
  messages: 40,
  messageChars: 4000,
  contextChars: 8000,
  perMinute: 20,
};

let client = null;
function getClient() {
  // Created lazily so the server can start (and report a clear error) even
  // before credentials are configured.
  client ??= new Anthropic();
  return client;
}

// --- Request hygiene -----------------------------------------------------------

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMITS.perMinute;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > LIMITS.bodyBytes) {
        reject(Object.assign(new Error('too large'), { status: 413 }));
        req.destroy();
      } else chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** Validate and normalise the conversation into the Messages API shape. */
function toApiMessages(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > LIMITS.messages) return null;
  const messages = [];
  for (const m of raw) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return null;
    if (typeof m.content !== 'string' || !m.content.trim()) continue;
    messages.push({ role: m.role, content: m.content.slice(0, LIMITS.messageChars) });
  }
  // The API requires the first turn to be the user's, and the last to be the new question.
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== 'user') return null;
  return messages;
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

// --- Claude --------------------------------------------------------------------

/** Turn a tool call into the proposal shape the app understands. */
function toProposal(block) {
  const input = block.input ?? {};
  if (block.name === 'propose_tasks' && Array.isArray(input.tasks) && input.tasks.length) {
    const tasks = input.tasks
      .filter((t) => typeof t?.title === 'string' && t.title.trim())
      .slice(0, 12)
      .map((t) => ({
        title: t.title.trim().slice(0, 120),
        dueDate: /^\d{4}-\d{2}-\d{2}$/.test(t.due_date ?? '') ? t.due_date : null,
        categoryKey: t.category ?? null,
      }));
    if (!tasks.length) return null;
    return {
      type: 'create_tasks',
      title: String(input.title || 'Suggested checklist').slice(0, 80),
      summary: `${tasks.length} tasks to review`,
      payload: { tasks },
    };
  }
  if (block.name === 'draft_message' && typeof input.body === 'string' && input.body.trim()) {
    return {
      type: 'draft_message',
      title: String(input.title || 'Draft message').slice(0, 80),
      summary: 'Edit, then share or copy',
      payload: { body: input.body },
    };
  }
  return null;
}

async function answer({ messages, context }) {
  const contextJson = JSON.stringify(context ?? {}).slice(0, LIMITS.contextChars);

  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    // If Claude Opus 5 declines, the API re-runs the request on Anthropic's
    // recommended fallback model instead of returning a refusal.
    fallbacks: 'default',
    output_config: { effort: EFFORT },
    system: [
      // Stable, cached prefix.
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      // Per-couple context: after the breakpoint, so it never invalidates the cache.
      { type: 'text', text: `Wedding context (JSON, today is ${context?.today ?? 'unknown'}):\n${contextJson}` },
    ],
    tools: TOOLS,
    tool_choice: { type: 'auto' },
    messages,
  });

  if (response.stop_reason === 'refusal') return { refused: true };

  let content = '';
  let proposal = null;
  for (const block of response.content) {
    if (block.type === 'text') content += block.text;
    else if (block.type === 'tool_use' && !proposal) proposal = toProposal(block);
  }

  content = content.trim();
  if (!content && proposal) {
    content =
      proposal.type === 'create_tasks'
        ? 'Here is a checklist for you to review - rename or remove anything before adding it to your plan.'
        : 'Here is a draft for you to edit before you send it.';
  }
  if (!content) content = 'I am not sure how to answer that one - could you say a little more?';
  if (response.stop_reason === 'max_tokens') content += '\n\n(That answer was cut short - ask me to continue.)';

  return { content, proposal, model: response.model, usage: response.usage };
}

// --- Server --------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true, model: MODEL });
  if (req.method !== 'POST' || req.url !== '/v1/chat') return send(res, 404, { error: 'not_found' });

  if (APP_TOKEN && req.headers['x-app-token'] !== APP_TOKEN) return send(res, 401, { error: 'unauthorised' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  if (rateLimited(ip)) return send(res, 429, { error: 'rate_limited' });

  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch (error) {
    return send(res, error.status ?? 400, { error: 'bad_request' });
  }

  const messages = toApiMessages(body?.messages);
  if (!messages) return send(res, 400, { error: 'bad_request' });

  const started = Date.now();
  try {
    const result = await answer({ messages, context: body.context });
    if (result.refused) return send(res, 422, { error: 'declined' });
    console.log(
      `[chat] ${result.model} ${Date.now() - started}ms in=${result.usage?.input_tokens} out=${result.usage?.output_tokens} cached=${result.usage?.cache_read_input_tokens ?? 0}${result.proposal ? ` proposal=${result.proposal.type}` : ''}`
    );
    return send(res, 200, { content: result.content, proposal: result.proposal, model: result.model });
  } catch (error) {
    // Most specific first, so retryable and non-retryable failures stay distinct.
    if (error instanceof Anthropic.RateLimitError) {
      console.warn('[chat] rate limited by Anthropic');
      return send(res, 429, { error: 'rate_limited' });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('[chat] Anthropic credentials are missing or invalid - set ANTHROPIC_API_KEY.');
      return send(res, 503, { error: 'unavailable' });
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error('[chat] bad request to Anthropic:', error.message);
      return send(res, 500, { error: 'internal' });
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`[chat] Anthropic API error ${error.status}:`, error.message);
      return send(res, (error.status ?? 500) >= 500 ? 503 : 500, { error: 'unavailable' });
    }
    console.error('[chat] unexpected failure:', error?.message ?? error);
    return send(res, 503, { error: 'unavailable' });
  }
});

server.listen(PORT, () => {
  console.log(`WeddingGPT AI proxy on http://localhost:${PORT} (model ${MODEL}, effort ${EFFORT})`);
  if (!APP_TOKEN) console.warn('APP_TOKEN is not set - anyone who finds this URL can use your API key.');
});
