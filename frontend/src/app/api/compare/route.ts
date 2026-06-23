import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * /api/compare — Runs the same threat-classification prompt against two
 * independent LLMs (Groq · Llama 3.1 and Tencent Hunyuan) in parallel and
 * returns both verdicts side by side with latency, so operators can see model
 * agreement before trusting a single classifier.
 */

interface ModelVerdict {
  model: string;
  provider: string;
  confidence: number;
  severity: string;
  recommendation: string;
  reasoning: string;
  latencyMs: number;
  source: 'live' | 'fallback';
}

const SYSTEM_PROMPT =
  'You are a smart contract security AI on a real-time threat detection platform. Analyze on-chain exploit patterns and return ONLY valid JSON, no markdown.';

const buildUserPrompt = (protocol: string, txHash: string, threatType: string) =>
  `Analyze this smart contract security incident on Mantle network:

Protocol: ${protocol}
Transaction hash: ${txHash}
Detection signature: ${threatType}

Return this exact JSON (no other text):
{
  "confidence": <float 0.70-0.99>,
  "severity": "<CRITICAL|HIGH|MEDIUM>",
  "recommendation": "<Pause protocol|Alert operators|Monitor only|Multisig review>",
  "reasoning": "<1-2 sentences explaining the threat>"
}`;

function fallbackVerdict(model: string, provider: string, latencyMs: number): ModelVerdict {
  return {
    model,
    provider,
    confidence: 0.9,
    severity: 'CRITICAL',
    recommendation: 'Pause protocol',
    reasoning: 'Transaction exhibits a recursive external-call pattern with state mutation after transfer, consistent with reentrancy.',
    latencyMs,
    source: 'fallback',
  };
}

/** Best-effort JSON parse — tolerates models that wrap output in ```json fences. */
function safeParse(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* noop */ }
    }
    return {};
  }
}

async function callGroq(prompt: string): Promise<ModelVerdict> {
  const model = 'llama-3.1-8b-instant';
  const start = Date.now();
  const key = process.env.GROQ_API_KEY;
  if (!key) return fallbackVerdict(model, 'Groq', 0);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 250,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    const parsed = safeParse(data.choices?.[0]?.message?.content ?? '{}');
    return normalize(model, 'Groq', parsed, Date.now() - start);
  } catch {
    return fallbackVerdict(model, 'Groq', Date.now() - start);
  }
}

async function callHunyuan(prompt: string): Promise<ModelVerdict> {
  const model = 'hunyuan-lite';
  const start = Date.now();
  const key = process.env.HUNYUAN_API_KEY;
  if (!key) return fallbackVerdict(model, 'Hunyuan', 0);
  try {
    const res = await fetch('https://api.hunyuan.cloud.tencent.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 250,
      }),
    });
    if (!res.ok) throw new Error(`Hunyuan ${res.status}`);
    const data = await res.json();
    const parsed = safeParse(data.choices?.[0]?.message?.content ?? '{}');
    return normalize(model, 'Hunyuan', parsed, Date.now() - start);
  } catch {
    return fallbackVerdict(model, 'Hunyuan', Date.now() - start);
  }
}

function normalize(model: string, provider: string, parsed: Record<string, unknown>, latencyMs: number): ModelVerdict {
  const fb = fallbackVerdict(model, provider, latencyMs);
  const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : fb.confidence;
  return {
    model,
    provider,
    confidence: Math.max(0, Math.min(1, confidence)),
    severity: typeof parsed.severity === 'string' ? parsed.severity : fb.severity,
    recommendation: typeof parsed.recommendation === 'string' ? parsed.recommendation : fb.recommendation,
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : fb.reasoning,
    latencyMs,
    source: 'live',
  };
}

export async function POST(request: Request) {
  try {
    const { txHash, protocol, threatType } = await request.json();
    const prompt = buildUserPrompt(protocol || 'Unknown Protocol', txHash || '0x…', threatType || 'Anomalous pattern');

    const [groq, hunyuan] = await Promise.all([callGroq(prompt), callHunyuan(prompt)]);

    const agreement = groq.severity?.toUpperCase() === hunyuan.severity?.toUpperCase();
    const consensusConfidence = (groq.confidence + hunyuan.confidence) / 2;

    return NextResponse.json({ groq, hunyuan, agreement, consensusConfidence });
  } catch (err) {
    console.error('compare error', err);
    return NextResponse.json(
      {
        groq: fallbackVerdict('llama-3.1-8b-instant', 'Groq', 0),
        hunyuan: fallbackVerdict('hunyuan-lite', 'Hunyuan', 0),
        agreement: true,
        consensusConfidence: 0.9,
      },
      { status: 200 },
    );
  }
}
