const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export interface PolishInput {
  summary: string;
  reasoning: string[];
}

export interface PolishResult {
  summary: string;
  reasoning: string[];
}

/**
 * Calls Groq chat completions; returns parsed JSON { summary, reasoning } or throws.
 */
export async function polishWithGroq(
  input: PolishInput,
  apiKey: string,
  modelId: string = process.env.GROQ_MODEL ?? DEFAULT_MODEL,
): Promise<PolishResult> {
  const system = `You are an editor. Rewrite ONLY for tone and clarity.
Rules (strict):
- Do NOT add numbers, dollar amounts, currencies, percentages, dates, or new proper names.
- Do NOT add new claims or facts. Do NOT contradict the given summary or reasoning bullets.
- Preserve all factual content from the input; you may reorder or shorten words for clarity.
- Output ONLY valid JSON with shape: {"summary":"string","reasoning":["string",...]}
- The "reasoning" array must have the same length as the input reasoning array; each item corresponds by index.`;

  const user = JSON.stringify({
    summary: input.summary,
    reasoning: input.reasoning,
  });

  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      temperature: 0.25,
      max_tokens: 2048,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Polish this JSON:\n${user}` },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("Groq returned empty content");
  }

  let jsonStr = raw;
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    jsonStr = fence[1].trim();
  }

  const parsed = JSON.parse(jsonStr) as { summary?: unknown; reasoning?: unknown };
  if (typeof parsed.summary !== "string" || !Array.isArray(parsed.reasoning)) {
    throw new Error("Groq JSON missing summary or reasoning array");
  }

  const reasoning = parsed.reasoning.map((r) => String(r));
  if (reasoning.length !== input.reasoning.length) {
    throw new Error("Groq reasoning length mismatch");
  }

  return {
    summary: parsed.summary,
    reasoning,
  };
}
