import { NextRequest } from 'next/server';
import { selectProviderAndStream } from '../../../lib/llm/providers';
import { buildPrompt } from '../../../lib/prompt/buildPrompt';

export const runtime = 'nodejs'; // edge can be considered later

interface ChatRequestBody { question?: unknown; metricsSummary?: unknown }

function normalizeQuestion(q: unknown): string {
  if (typeof q === 'string') return q.trim();
  return '';
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody = {};
  try {
    body = await req.json();
  } catch {
    return new Response('Bad Request: invalid JSON', { status: 400 });
  }
  const question = normalizeQuestion(body.question);
  if (!question) {
    return new Response('Bad Request: question required', { status: 400 });
  }
  try {
    const prompt = buildPrompt(question, body.metricsSummary);
    const stream = await selectProviderAndStream(prompt);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (e: any) {
    console.error('Chat route error', e);
    return new Response('Internal Server Error: ' + (e?.message || 'unknown'), { status: 500 });
  }
}
