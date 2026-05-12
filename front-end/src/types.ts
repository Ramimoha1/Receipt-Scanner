/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReceiptItem {
  description: string;
  quantity: number;
  price: number;
}

export interface ReceiptData {
  id: string;
  merchantName: string;
  date: string;
  totalAmount: number;
  currency: string;
  taxAmount?: number;
  items: ReceiptItem[];
  timestamp: number;
}

export type AppState = 'IDLE' | 'UPLOADING' | 'EXTRACTING' | 'REVIEW' | 'SUBMITTED';
export type ViewMode = 'SCAN' | 'HISTORY';
