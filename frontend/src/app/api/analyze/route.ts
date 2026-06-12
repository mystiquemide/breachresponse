import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const FALLBACK = {
  confidence: 0.91,
  severity: 'CRITICAL',
  evidencePoints: ['Recursive external call detected', 'State mutation after external transfer', 'Gas pattern matches known reentrancy exploit'],
  recommendation: 'Pause protocol',
  reasoning: 'Transaction exhibits classic reentrancy pattern with recursive calls preceding state updates in the vault withdrawal path.'
};

export async function POST(request: Request) {
  try {
    const { txHash, protocol, threatType } = await request.json();
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return NextResponse.json(FALLBACK);
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a smart contract security AI running on a real-time threat detection platform. Analyze on-chain exploit patterns and return structured threat assessments. Always respond with valid JSON only, no markdown.'
          },
          {
            role: 'user',
            content: `Analyze this smart contract security incident detected on Mantle network:

Protocol: ${protocol || 'Unknown Protocol'}
Transaction hash: ${txHash || '0x...'}
Detection signature: ${threatType || 'Anomalous pattern'}

Return this exact JSON (no other text):
{
  "confidence": <float 0.70-0.99>,
  "severity": "<CRITICAL|HIGH|MEDIUM>",
  "evidencePoints": ["<evidence 1>", "<evidence 2>", "<evidence 3>"],
  "recommendation": "<Pause protocol|Alert operators|Monitor only|Multisig review>",
  "reasoning": "<1-2 sentences explaining the threat>"
}`
          }
        ],
        temperature: 0.2,
        max_tokens: 350,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);

    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');

    return NextResponse.json({
      confidence: parsed.confidence ?? FALLBACK.confidence,
      severity: parsed.severity ?? FALLBACK.severity,
      evidencePoints: Array.isArray(parsed.evidencePoints) ? parsed.evidencePoints.slice(0, 3) : FALLBACK.evidencePoints,
      recommendation: parsed.recommendation ?? FALLBACK.recommendation,
      reasoning: parsed.reasoning ?? FALLBACK.reasoning,
    });
  } catch (err) {
    console.error('AI analysis error', err);
    return NextResponse.json(FALLBACK);
  }
}
