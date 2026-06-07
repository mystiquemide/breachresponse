import { createAccount, createClient, generatePrivateKey } from 'genlayer-js';
import { simulator } from 'genlayer-js/chains';
import { TransactionStatus, type Address } from 'genlayer-js/types';

const STORAGE_KEY = 'breachresponse_genlayer_pk';

export const GENLAYER_CONSENSUS_GUARD_ADDRESS = (process.env.NEXT_PUBLIC_GENLAYER_CONSENSUS_GUARD_ADDRESS || '') as Address | '';
export const GENLAYER_STUDIO_URL = process.env.NEXT_PUBLIC_GENLAYER_STUDIO_URL || 'https://studio.genlayer.com/api';

export type GenLayerAccount = ReturnType<typeof createAccount>;
export type GenLayerClient = ReturnType<typeof createClient>;

export interface ConsensusIncidentInput {
  incidentId: string;
  protocol: string;
  txHash: string;
  threatType: string;
  proposedAction: string;
  llmReasoning: string;
  confidence: string;
}

export function getStoredGenLayerAccount(): GenLayerAccount | null {
  if (typeof window === 'undefined') return null;
  const privateKey = window.localStorage.getItem(STORAGE_KEY);
  if (!privateKey) return null;

  try {
    return createAccount(privateKey as `0x${string}`);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function generateGenLayerAccount(): GenLayerAccount {
  if (typeof window === 'undefined') {
    throw new Error('GenLayer account generation requires a browser');
  }

  const privateKey = generatePrivateKey();
  window.localStorage.setItem(STORAGE_KEY, privateKey);
  return createAccount(privateKey as `0x${string}`);
}

export function clearGenLayerAccount() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function createGenLayerClient(account?: GenLayerAccount | null): GenLayerClient {
  return createClient({
    chain: simulator,
    endpoint: GENLAYER_STUDIO_URL,
    ...(account ? { account } : {}),
  });
}

export class IncidentConsensusGuardClient {
  private client: GenLayerClient;

  constructor(client: GenLayerClient) {
    this.client = client;
  }

  setClient(client: GenLayerClient) {
    this.client = client;
  }

  private requireAddress() {
    if (!GENLAYER_CONSENSUS_GUARD_ADDRESS) {
      throw new Error('NEXT_PUBLIC_GENLAYER_CONSENSUS_GUARD_ADDRESS is not configured');
    }
    return GENLAYER_CONSENSUS_GUARD_ADDRESS as Address;
  }

  async listIncidents() {
    return this.client.readContract({
      address: this.requireAddress(),
      functionName: 'list_incidents',
      args: [],
    });
  }

  async getIncident(incidentId: string) {
    return this.client.readContract({
      address: this.requireAddress(),
      functionName: 'get_incident',
      args: [incidentId],
    });
  }

  async submitIncident(input: ConsensusIncidentInput) {
    const txHash = await this.client.writeContract({
      address: this.requireAddress(),
      functionName: 'submit_incident',
      value: BigInt(0),
      args: [
        input.incidentId,
        input.protocol,
        input.txHash,
        input.threatType,
        input.proposedAction,
        input.llmReasoning,
        input.confidence,
      ],
    });

    return this.client.waitForTransactionReceipt({
      hash: txHash,
      status: TransactionStatus.FINALIZED,
      interval: 10000,
      retries: 30,
    });
  }

  async evaluateIncident(incidentId: string) {
    const txHash = await this.client.writeContract({
      address: this.requireAddress(),
      functionName: 'evaluate_incident',
      value: BigInt(0),
      args: [incidentId],
    });

    return this.client.waitForTransactionReceipt({
      hash: txHash,
      status: TransactionStatus.FINALIZED,
      interval: 10000,
      retries: 30,
    });
  }
}
