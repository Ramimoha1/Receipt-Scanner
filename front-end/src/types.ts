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

export type ReceiptStatus = 'PENDING' | 'REVIEWED' | 'SAVED';

export interface ReceiptFormValues {
  merchantName: string;
  transactionDate: string;
  totalAmount: number;
  currency: string;
  imageUrl: string;
  status?: ReceiptStatus;
}

export interface ReceiptRecord extends ReceiptFormValues {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AppState = 'IDLE' | 'REVIEW' | 'SUBMITTED';
export type ViewMode = 'SCAN' | 'HISTORY';
