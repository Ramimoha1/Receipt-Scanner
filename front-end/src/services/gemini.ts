/// <reference types="vite/client" />

import type { ReceiptData } from '../types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

type PrefillResponse = Omit<ReceiptData, 'id' | 'timestamp'>;

export async function extractReceiptData(base64Image: string, mimeType: string): Promise<ReceiptData> {
  const response = await fetch(`${apiBaseUrl}/gemini/prefill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageData: base64Image,
      mimeType,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
    if (response.status === 429) {
      throw new Error(errorBody?.message ?? 'max rate reached for ai api');
    }
    throw new Error(errorBody?.message ?? 'ai failed');
  }

  const data = (await response.json()) as PrefillResponse;
  return {
    ...data,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
}
