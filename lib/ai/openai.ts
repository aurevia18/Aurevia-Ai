type GenerateAureviaTextOptions = {
  instructions: string;
  input: string;
  maxOutputTokens?: number;
};

function responseText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const record = payload as { output_text?: unknown; output?: unknown };
  if (typeof record.output_text === 'string') return record.output_text.trim();
  if (!Array.isArray(record.output)) return '';
  const chunks: string[] = [];
  for (const item of record.output) {
    if (!item || typeof item !== 'object') continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && typeof part === 'object' && (part as { type?: unknown }).type === 'output_text' && typeof (part as { text?: unknown }).text === 'string') {
        chunks.push((part as { text: string }).text);
      }
    }
  }
  return chunks.join('\n').trim();
}

/** Server-only Responses API adapter. Returns null when unconfigured or unavailable. */
export async function generateAureviaText({ instructions, input, maxOutputTokens = 500 }: GenerateAureviaTextOptions): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-6-astra';
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions,
        input,
        max_output_tokens: maxOutputTokens,
        store: false,
      }),
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const text = responseText(await response.json());
    return text ? text.slice(0, 8000) : null;
  } catch {
    return null;
  }
}
