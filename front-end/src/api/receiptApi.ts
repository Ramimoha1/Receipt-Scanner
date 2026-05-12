import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReceiptFormValues, ReceiptRecord, ReceiptStatus } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
});

const receiptKeys = {
  all: ['receipts'] as const,
  lists: () => [...receiptKeys.all, 'list'] as const,
  detail: (id: string) => [...receiptKeys.all, 'detail', id] as const,
  byStatus: (status: ReceiptStatus) => [...receiptKeys.all, 'status', status] as const,
};

export async function fetchReceipts(): Promise<ReceiptRecord[]> {
  const response = await api.get<ReceiptRecord[]>('/receipts');
  return response.data;
}

export async function fetchReceiptById(id: string): Promise<ReceiptRecord> {
  const response = await api.get<ReceiptRecord>(`/receipts/${id}`);
  return response.data;
}

export async function fetchReceiptsByStatus(status: ReceiptStatus): Promise<ReceiptRecord[]> {
  const response = await api.get<ReceiptRecord[]>(`/receipts/status/${status}`);
  return response.data;
}

export async function createReceipt(receipt: ReceiptFormValues): Promise<ReceiptRecord> {
  const response = await api.post<ReceiptRecord>('/receipts', receipt);
  return response.data;
}

export async function updateReceipt(id: string, receipt: ReceiptFormValues): Promise<ReceiptRecord> {
  const response = await api.put<ReceiptRecord>(`/receipts/${id}`, receipt);
  return response.data;
}

export async function deleteReceipt(id: string): Promise<void> {
  await api.delete(`/receipts/${id}`);
}

export function useReceipts() {
  return useQuery({
    queryKey: receiptKeys.lists(),
    queryFn: fetchReceipts,
  });
}

export function useReceiptsByStatus(status: ReceiptStatus) {
  return useQuery({
    queryKey: receiptKeys.byStatus(status),
    queryFn: () => fetchReceiptsByStatus(status),
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReceipt,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: receiptKeys.all });
    },
  });
}

export function useUpdateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, receipt }: { id: string; receipt: ReceiptFormValues }) => updateReceipt(id, receipt),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: receiptKeys.all });
    },
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReceipt,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: receiptKeys.all });
    },
  });
}
