import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CloudUpload,
  Edit3,
  History,
  Loader2,
  Plus,
  Receipt,
  RefreshCcw,
  Sparkles,
  Store,
  Trash2,
  Upload,
} from 'lucide-react';
import { cn } from './lib/utils';
import {
  AppState,
  ReceiptFormValues,
  ReceiptRecord,
  ReceiptStatus,
  ViewMode,
} from './types';
import {
  useCreateReceipt,
  useDeleteReceipt,
  useReceipts,
  useUpdateReceipt,
} from './api/receiptApi';
import { extractReceiptData } from './services/gemini';

const today = new Date().toISOString().slice(0, 10);

const createEmptyDraft = (imageUrl = ''): ReceiptFormValues => ({
  merchantName: '',
  transactionDate: today,
  totalAmount: 0,
  currency: 'MYR',
  imageUrl,
  status: 'PENDING',
});

function formatCurrency(currency: string, amount: number) {
  return `${currency} ${Number(amount || 0).toFixed(2)}`;
}
function parseDateToIso(dateStr?: string | null): string {
    // 1. Handle missing or literal "null" strings
    if (!dateStr || dateStr.toLowerCase() === 'null') {
      return today; 
    }

    // 2. If Gemini followed instructions perfectly (YYYY-MM-DD), return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // 3. If Gemini went rogue (e.g., "12 May 2026" or "05/12/2026"), try to salvage it
    const parsed = new Date(dateStr);
    if (!Number.isNaN(parsed.getTime())) {
      // Convert valid but weirdly formatted dates back to YYYY-MM-DD
      return parsed.toISOString().slice(0, 10);
    }

    // 4. Ultimate fallback if the string is complete gibberish
    return today;
  }

function formatDateLabel(value?: string | null) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusLabel(status?: ReceiptStatus) {
  switch (status) {
    case 'SAVED':
      return 'Saved';
    case 'REVIEWED':
      return 'Reviewed';
    default:
      return 'Pending';
  }
}

export default function App() {
  const [state, setState] = useState<AppState>('IDLE');
  const [viewMode, setViewMode] = useState<ViewMode>('SCAN');
  const [error, setError] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReceiptFormValues | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);

  const receiptsQuery = useReceipts();
  const createReceiptMutation = useCreateReceipt();
  const updateReceiptMutation = useUpdateReceipt();
  const deleteReceiptMutation = useDeleteReceipt();

  const receipts = receiptsQuery.data ?? [];
  const isSaving = createReceiptMutation.isPending || updateReceiptMutation.isPending;

  const resetComposer = useCallback(() => {
    setState('IDLE');
    setError(null);
    setPrefillError(null);
    setIsPrefilling(false);
    setReceiptImage(null);
    setDraft(null);
    setEditingId(null);
  }, []);

  const beginEdit = useCallback((receipt: ReceiptRecord) => {
    setEditingId(receipt.id);
    setReceiptImage(receipt.imageUrl);
    setDraft({
      merchantName: receipt.merchantName,
      transactionDate: receipt.transactionDate,
      totalAmount: receipt.totalAmount,
      currency: receipt.currency,
      imageUrl: receipt.imageUrl,
      status: receipt.status ?? 'PENDING',
    });
    setError(null);
    setViewMode('SCAN');
    setState('REVIEW');
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const imageUrl = String(reader.result ?? '');
      setReceiptImage(imageUrl);
      setDraft(createEmptyDraft(imageUrl));
      setEditingId(null);
      setError(null);
      setPrefillError(null);
      setViewMode('SCAN');
      setState('REVIEW');
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePrefillWithAI = useCallback(async () => {
    if (!receiptImage) return;
    setPrefillError(null);
    setIsPrefilling(true);

    try {
      const mimeType = receiptImage.split(';')[0].split(':')[1] || 'image/jpeg';
      const aiData = await extractReceiptData(receiptImage, mimeType);
      setDraft((current) => {
        if (!current) return current;
        return {
          ...current,
          merchantName: aiData.merchantName || current.merchantName,
          transactionDate: parseDateToIso(aiData.date) || current.transactionDate,
          totalAmount: aiData.totalAmount ?? current.totalAmount,
          currency: aiData.currency || current.currency,
        };
      });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'ai failed';
      setPrefillError(message);
    } finally {
      setIsPrefilling(false);
    }
  }, [receiptImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false,
  });

  const updateField = useCallback(<K extends keyof ReceiptFormValues>(field: K, value: ReceiptFormValues[K]) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }, []);

  const submitReceipt = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;

    const payload: ReceiptFormValues = {
      ...draft,
      imageUrl: receiptImage || draft.imageUrl,
      currency: draft.currency || 'MYR',
      status: draft.status || 'PENDING',
    };

    if (!payload.imageUrl) {
      setError('Please upload a receipt image before saving.');
      return;
    }

    setError(null);

    try {
      if (editingId) {
        await updateReceiptMutation.mutateAsync({ id: editingId, receipt: payload });
      } else {
        await createReceiptMutation.mutateAsync(payload);
      }
      setState('SUBMITTED');
      receiptsQuery.refetch();
    } catch (mutationError) {
      console.error(mutationError);
      setError('Could not save the receipt. Please try again.');
      setState('REVIEW');
    }
  };

  const removeReceipt = async (id: string) => {
    if (!window.confirm('Delete this receipt?')) return;
    await deleteReceiptMutation.mutateAsync(id);
    if (editingId === id) {
      resetComposer();
    }
  };

  const openNewComposer = () => {
    resetComposer();
    setViewMode('SCAN');
    setState('IDLE');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <button className="flex items-center gap-2 cursor-pointer" onClick={openNewComposer}>
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 tracking-tight text-lg">ReceiptScanner AI</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
              API Connected
            </span>
            <button
              onClick={() => receiptsQuery.refetch()}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          {state === 'IDLE' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto mt-8"
            >
              <div className="flex justify-center mb-10">
                <div className="bg-slate-200/50 p-1 rounded-xl flex gap-1">
                  <button
                    onClick={() => setViewMode('SCAN')}
                    className={cn(
                      'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all',
                      viewMode === 'SCAN'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200',
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    New Receipt
                  </button>
                  <button
                    onClick={() => setViewMode('HISTORY')}
                    className={cn(
                      'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all',
                      viewMode === 'HISTORY'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200',
                    )}
                  >
                    <History className="w-4 h-4" />
                    History
                    {receipts.length > 0 && (
                      <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full text-[10px]">
                        {receipts.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {viewMode === 'SCAN' ? (
                <div className="max-w-3xl mx-auto w-full">
                    <div className="text-center mb-8">
                      <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Receipt Prefill</h1>
                      <p className="text-slate-500">Upload an image and let AI fill the receipt form before you save it.</p>
                    </div>

                    {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{error}</p>
                      </div>
                    )}

                    <div
                      {...getRootProps()}
                      className={cn(
                        'relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 group bg-white',
                        isDragActive
                          ? 'border-indigo-400 bg-indigo-50/50 scale-[1.01]'
                          : 'border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50 shadow-sm',
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300',
                          isDragActive ? 'bg-indigo-100 scale-110 rotate-12' : 'bg-indigo-50 group-hover:bg-indigo-100/50',
                        )}>
                          <CloudUpload className={cn(
                            'w-10 h-10 transition-colors',
                            isDragActive ? 'text-indigo-600' : 'text-indigo-400 group-hover:text-indigo-500',
                          )} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">
                          {isDragActive ? 'Drop the file' : 'Upload Receipt Image'}
                        </h3>
                        <p className="text-slate-400 text-sm max-w-[260px] mx-auto">
                          Drag and drop your image here, or click to browse files. AI will prefill the form.
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {[
                        { title: 'Create', desc: 'Save manual entries to the DB', icon: Plus },
                        { title: 'Update', desc: 'Edit previous receipts from history', icon: Edit3 },
                        { title: 'Delete', desc: 'Remove receipts instantly', icon: Trash2 },
                      ].map((feature, i) => (
                        <div key={i} className="flex flex-col items-center text-center">
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-3">
                            <feature.icon className="w-5 h-5 text-indigo-500" />
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">{feature.title}</h4>
                          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{feature.desc}</p>
                        </div>
                      ))}
                    </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {receiptsQuery.isLoading ? (
                    <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl">
                      <Loader2 className="w-8 h-8 mx-auto animate-spin text-indigo-600" />
                      <p className="mt-4 text-sm font-semibold text-slate-500">Loading receipts...</p>
                    </div>
                  ) : receiptsQuery.isError ? (
                    <div className="text-center py-20 bg-white border border-red-200 rounded-3xl">
                      <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
                      <p className="mt-4 text-sm font-semibold text-red-600">Could not load receipts from the backend.</p>
                      <button
                        onClick={() => receiptsQuery.refetch()}
                        className="mt-4 px-4 py-2 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100"
                      >
                        Try again
                      </button>
                    </div>
                  ) : receipts.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl border-dashed">
                      <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-800">No receipts yet</h3>
                      <p className="text-slate-400 text-sm">Saved receipts will appear here.</p>
                      <button
                        onClick={() => setViewMode('SCAN')}
                        className="mt-6 text-indigo-600 font-bold text-sm hover:underline"
                      >
                        Add your first receipt
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {receipts.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-md transition-all group"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                {(item.merchantName || '?')[0]?.toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 truncate">{item.merchantName || 'Untitled receipt'}</h4>
                                <div className="flex flex-wrap items-center gap-3 mt-1">
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDateLabel(item.transactionDate)}
                                  </span>
                                  <span className="text-xs text-slate-300">•</span>
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock3 className="w-3 h-3" />
                                    {formatDateLabel(item.createdAt)}
                                  </span>
                                  <span className="text-xs text-slate-300">•</span>
                                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    {statusLabel(item.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 lg:gap-6">
                              <div className="text-right">
                                <div className="text-sm font-bold text-slate-900">
                                  {formatCurrency(item.currency, item.totalAmount)}
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                  Saved receipt
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => beginEdit(item)}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors font-semibold text-sm"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => removeReceipt(item.id)}
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-semibold text-sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors hidden lg:block" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {state === 'REVIEW' && draft && (
            <motion.div
              key="review"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-12 max-w-4xl mx-auto w-full space-y-6 pb-12">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                      <h3 className="font-black text-2xl text-slate-800 tracking-tight">
                        {editingId ? 'Edit Receipt' : 'Review & Save Receipt'}
                      </h3>
                      <p className="text-slate-400 text-sm mt-0.5 font-medium">
                        Confirm the details before storing them in PostgreSQL.
                      </p>
                    </div>
                    <div className="text-[10px] font-black bg-indigo-600 text-white px-2.5 py-1 rounded-full uppercase tracking-widest">
                      AI PREFILLED
                    </div>
                  </div>

                  <form onSubmit={submitReceipt} className="p-8 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="col-span-full">
                        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                          <Store className="w-3.5 h-3.5" />
                          Merchant Name
                        </label>
                        <input
                          type="text"
                          value={draft.merchantName}
                          onChange={(e) => updateField('merchantName', e.target.value)}
                          placeholder="e.g. Starbucks, Amazon"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 text-lg shadow-inner"
                          required
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Transaction Date
                        </label>
                        <input
                          type="date"
                          value={draft.transactionDate}
                          onChange={(e) => updateField('transactionDate', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                          required
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                          <Receipt className="w-3.5 h-3.5" />
                          Total Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={draft.totalAmount}
                          onChange={(e) => updateField('totalAmount', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                          required
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Currency
                        </label>
                        <input
                          type="text"
                          value={draft.currency}
                          onChange={(e) => updateField('currency', e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Optional workflow marker</p>
                        </div>
                        <select
                          value={draft.status ?? 'PENDING'}
                          onChange={(e) => updateField('status', e.target.value as ReceiptStatus)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 outline-none"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="REVIEWED">Reviewed</option>
                          <option value="SAVED">Saved</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-4 shadow-2xl shadow-indigo-900/20">
                      <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Saved Image</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base64 stored as `imageUrl`</span>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 aspect-[3/1.4] flex items-center justify-center">
                        {receiptImage ? (
                          <img src={receiptImage} alt="Receipt preview" className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-center px-6">
                            <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                            <p className="text-sm text-slate-300">No receipt image attached</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={resetComposer}
                        className="flex-1 py-4 rounded-2xl font-black text-base border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className={cn(
                          'flex-1 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all active:scale-[0.99] shadow-xl',
                          isSaving ? 'bg-slate-300 text-slate-600' : 'bg-indigo-600 text-white hover:bg-black hover:shadow-indigo-500/20',
                        )}
                      >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        {editingId ? 'UPDATE RECEIPT' : 'CONFIRM & SAVE'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

            </motion.div>
          )}

          {state === 'SUBMITTED' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto mt-12 p-8 bg-black text-white rounded-3xl text-center space-y-4"
            >
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-black tracking-tight">Saved to Database</h4>
              <p className="text-slate-400 text-sm font-medium">Your receipt has been recorded successfully.</p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={openNewComposer}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-white hover:text-black transition-all active:scale-95"
                >
                  NEW RECEIPT
                </button>
                <button
                  onClick={() => setViewMode('HISTORY')}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl font-black text-sm hover:bg-white/20 transition-all active:scale-95"
                >
                  VIEW HISTORY
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 px-6 text-center border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex-wrap justify-center">
            <span>Backend Connected</span>
            <span>•</span>
            <span>CRUD Ready</span>
            <span>•</span>
            <span>PostgreSQL Persisted</span>
          </div>
          <p className="text-slate-300 text-[10px] font-medium tracking-tight">
            © 2026 ReceiptScanner AI • Connected Frontend • API v1
          </p>
        </div>
      </footer>
    </div>
  );
}
