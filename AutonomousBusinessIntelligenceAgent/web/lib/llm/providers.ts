interface ProviderResult {
  stream: ReadableStream<Uint8Array>;
  provider: string;
}

function sseToTextStream(raw: ReadableStream<Uint8Array>, provider: string): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const reader = raw.getReader();
      (async function pump(){
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode(`\n@@END@@{"provider":"${provider}"}`));
            controller.close();
            break;
          }
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, idx).trim();
              buffer = buffer.slice(idx + 1);
              if (!line) continue;
              if (line.startsWith('data:')) {
                const payload = line.slice(5).trim();
                if (payload === '[DONE]') continue; // end handled on done
                try {
                  const json = JSON.parse(payload);
                  // OpenAI / Azure chat completion delta formats diverge slightly
                  const choices = json.choices || [];
                  for (const ch of choices) {
                    const delta = ch.delta || ch.message || ch; // attempt fallback
                    const contentPiece = delta?.content;
                    if (typeof contentPiece === 'string' && contentPiece.length) {
                      controller.enqueue(encoder.encode(contentPiece));
                    }
                  }
                } catch { /* swallow non-JSON keepalive */ }
              }
            }
          }
        }
      })();
    }
  });
}

async function streamFromAzure(prompt: string): Promise<ProviderResult | null> {
  const key = process.env.AZURE_OPENAI_KEY;
  const endpointRaw = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';
  if (!key || !endpointRaw || !deployment) return null;
  const endpoint = endpointRaw.endsWith('/') ? endpointRaw : endpointRaw + '/';
  const url = `${endpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const body = JSON.stringify({
    model: deployment,
    messages: [
      { role: 'system', content: 'You are a helpful assistant for apparel BI.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 512,
    stream: true
  });
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': key },
      body
    });
    if (!resp.ok) {
      const errText = await safeReadErrorBody(resp);
      return errorTextStream(`Azure OpenAI error ${resp.status}: ${resp.statusText}. ${errText}`);
    }
    if (!resp.body) return errorTextStream('Azure OpenAI: empty response body');
    const stream = sseToTextStream(resp.body, 'azure');
    return { stream, provider: 'azure' };
  } catch (e: any) {
    return errorTextStream(`Azure OpenAI fetch failed: ${e?.message || e}`);
  }
}

async function streamFromOpenAI(prompt: string): Promise<ProviderResult | null> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!key) return null;
  const url = 'https://api.openai.com/v1/chat/completions';
  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant for apparel BI.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 512,
    stream: true
  });
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body
    });
    if (!resp.ok) {
      const errText = await safeReadErrorBody(resp);
      return errorTextStream(`OpenAI error ${resp.status}: ${resp.statusText}. ${errText}`);
    }
    if (!resp.body) return errorTextStream('OpenAI: empty response body');
    const stream = sseToTextStream(resp.body, 'openai');
    return { stream, provider: 'openai' };
  } catch (e: any) {
    return errorTextStream(`OpenAI fetch failed: ${e?.message || e}`);
  }
}

function mockStream(prompt: string): ProviderResult {
  const text = `MOCK RESPONSE\nPrompt excerpt: ${prompt.slice(0,120)}...`;
  const encoded = new TextEncoder().encode(text);
  const stream = new ReadableStream<Uint8Array>({
    start(ctrl: ReadableStreamDefaultController<Uint8Array>) {
      ctrl.enqueue(encoded);
      ctrl.enqueue(new TextEncoder().encode(`\n@@END@@{"provider":"mock"}`));
      ctrl.close();
    }
  });
  return { stream, provider: 'mock' };
}

function errorTextStream(message: string): ProviderResult {
  const text = `PROVIDER ERROR:\n${message}`;
  const encoded = new TextEncoder().encode(text);
  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      ctrl.enqueue(encoded);
      ctrl.enqueue(new TextEncoder().encode(`\n@@END@@{"provider":"error"}`));
      ctrl.close();
    }
  });
  return { stream, provider: 'error' };
}

async function safeReadErrorBody(resp: Response): Promise<string> {
  try {
    const text = await resp.text();
    if (!text) return '(no body)';
    // Try to shorten overly long HTML or JSON
    return text.slice(0, 400);
  } catch {
    return '(unreadable error body)';
  }
}

export async function selectProviderAndStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
  const azure = await streamFromAzure(prompt);
  if (azure) return azure.stream;
  const openai = await streamFromOpenAI(prompt);
  if (openai) return openai.stream;
  return mockStream(prompt).stream;
}
