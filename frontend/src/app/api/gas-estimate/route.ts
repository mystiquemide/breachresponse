import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MANTLE_RPC = 'https://rpc.sepolia.mantle.xyz';
// MNT/USD approximate (testnet, not live price)
const MNT_USD_APPROX = 0.80;

const FALLBACK = {
  estimatedGas: 45000,
  gasPriceGwei: 0.02,
  estimatedCostMNT: '0.0000009',
  estimatedCostUSD: '0.00000072',
  optimizations: [
    'Use uint256 instead of smaller integer types to avoid packing overhead in storage',
    'Cache storage variables in memory at the top of hot functions',
    'Emit events instead of storing non-critical data on-chain',
  ],
  summary: 'This is a standard operation. Savings are possible by reducing storage writes and using packed structs where applicable.',
};

async function rpcCall(method: string, params: unknown[]) {
  const res = await fetch(MANTLE_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}

async function callAI(estimatedGas: number, calldata: string, address: string): Promise<string[] | null> {
  const prompt = `A developer is calling a smart contract on Mantle Sepolia (EVM L2) with the following details:

Contract address: ${address}
Calldata: ${calldata.slice(0, 200)}
Estimated gas: ${estimatedGas.toLocaleString()} units

Provide 3 specific, actionable Solidity gas optimization suggestions that could reduce this gas cost. Focus on Mantle L2 specific optimizations and general EVM best practices.

Return only a JSON array of strings (no other text):
["<optimization 1>", "<optimization 2>", "<optimization 3>"]`;

  const hunyuanKey = process.env.HUNYUAN_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (hunyuanKey) {
    try {
      const res = await fetch('https://api.hunyuan.cloud.tencent.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${hunyuanKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hunyuan-lite',
          messages: [
            { role: 'system', content: 'You are an EVM gas optimization expert. Return only valid JSON arrays. No markdown.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 400,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content ?? '';
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) return parsed.slice(0, 3);
      }
    } catch { /* fall through */ }
  }

  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are an EVM gas optimization expert. Return only valid JSON arrays. No markdown.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 400,
          response_format: { type: 'json_object' },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content ?? '[]';
        const parsed = JSON.parse(content);
        // Groq json_object mode may return { optimizations: [...] } or just [...]
        const arr = Array.isArray(parsed) ? parsed : (parsed.optimizations ?? parsed.suggestions ?? []);
        if (Array.isArray(arr) && arr.length > 0) return arr.slice(0, 3);
      }
    } catch { /* fall through */ }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, calldata, from } = body as { address: string; calldata: string; from?: string };

    if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid contract address.' }, { status: 400 });
    }
    if (!calldata || !/^0x[0-9a-fA-F]*$/.test(calldata)) {
      return NextResponse.json({ error: 'Invalid calldata. Must start with 0x followed by hex chars.' }, { status: 400 });
    }

    // Get current gas price from Mantle RPC
    const gasPriceHex: string = await rpcCall('eth_gasPrice', []);
    const gasPriceWei = parseInt(gasPriceHex, 16);
    const gasPriceGwei = gasPriceWei / 1e9;

    // Estimate gas for the call
    let estimatedGas: number;
    try {
      const estimateHex: string = await rpcCall('eth_estimateGas', [{
        to: address,
        data: calldata,
        from: from ?? '0x0000000000000000000000000000000000000001',
      }]);
      estimatedGas = parseInt(estimateHex, 16);
    } catch (err) {
      // eth_estimateGas can revert - still return gas price and helpful info
      const errMsg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({
        error: `Gas estimation failed: ${errMsg.slice(0, 120)}. The transaction may revert or require a specific caller.`,
        gasPriceGwei: parseFloat(gasPriceGwei.toFixed(6)),
      }, { status: 422 });
    }

    const costWei = BigInt(estimatedGas) * BigInt(gasPriceWei);
    const costMNT = Number(costWei) / 1e18;
    const costUSD = costMNT * MNT_USD_APPROX;

    const aiOptimizations = await callAI(estimatedGas, calldata, address);

    return NextResponse.json({
      estimatedGas,
      gasPriceGwei: parseFloat(gasPriceGwei.toFixed(6)),
      estimatedCostMNT: costMNT.toFixed(10),
      estimatedCostUSD: costUSD.toFixed(8),
      optimizations: aiOptimizations ?? FALLBACK.optimizations,
      summary: `Estimated ${estimatedGas.toLocaleString()} gas units at ${gasPriceGwei.toFixed(4)} Gwei on Mantle Sepolia. Apply the suggestions below to reduce execution cost.`,
    });
  } catch (err) {
    console.error('Gas estimate error', err);
    return NextResponse.json(FALLBACK);
  }
}
