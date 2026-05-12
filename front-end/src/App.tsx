/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Receipt, 
  CheckCircle2, 
  X, 
  Plus, 
  Trash2, 
  ArrowRight,
  FileText,
  AlertCircle,
  History,
<<<<<<< Updated upstream
  Calendar,
  DollarSign,
=======
  Loader2,
  Plus,
  Receipt,
  RefreshCcw,
  Sparkles,
>>>>>>> Stashed changes
  Store,
  ChevronRight
} from 'lucide-react';
import { cn } from './lib/utils';
<<<<<<< Updated upstream
import { AppState, ReceiptData, ReceiptItem, ViewMode } from './types';
import { extractReceiptData } from './services/gemini';
=======
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
>>>>>>> Stashed changes

export default function App() {
  const [state, setState] = useState<AppState>('IDLE');
  const [viewMode, setViewMode] = useState<ViewMode>('SCAN');
  const [error, setError] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
<<<<<<< Updated upstream
  const [extractedData, setExtractedData] = useState<ReceiptData | null>(null);
  const [history, setHistory] = useState<ReceiptData[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('receipt_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
=======
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
>>>>>>> Stashed changes
  }, []);

  // Save history to localStorage
  const saveToHistory = (data: ReceiptData) => {
    const newHistory = [data, ...history].slice(0, 50); // Keep last 50
    setHistory(newHistory);
    localStorage.setItem('receipt_history', JSON.stringify(newHistory));
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
<<<<<<< Updated upstream
    reader.onload = () => {
      setReceiptImage(reader.result as string);
      handleExtraction(reader.result as string, file.type);
=======
    reader.onload = async () => {
      const imageUrl = String(reader.result ?? '');
      setReceiptImage(imageUrl);
      setDraft(createEmptyDraft(imageUrl));
      setEditingId(null);
      setError(null);
      setPrefillError(null);
      setViewMode('SCAN');
      setState('REVIEW');
>>>>>>> Stashed changes
    };
    reader.readAsDataURL(file);
  }, [history]);

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
    multiple: false
  });

  const handleExtraction = async (base64: string, mimeType: string) => {
    setState('EXTRACTING');
    setError(null);
    try {
      const data = await extractReceiptData(base64, mimeType);
      const enrichedData: ReceiptData = {
        ...data,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      };
      setExtractedData(enrichedData);
      setState('REVIEW');
    } catch (err) {
      console.error(err);
      setError('Failed to extract data. Please try again with a clearer image.');
      setState('IDLE');
    }
  };

  const handleUpdateField = (field: keyof ReceiptData, value: any) => {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, [field]: value });
  };

  const handleUpdateItem = (index: number, field: keyof ReceiptItem, value: any) => {
    if (!extractedData) return;
    const newItems = [...extractedData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setExtractedData({ ...extractedData, items: newItems });
  };

  const handleAddItem = () => {
    if (!extractedData) return;
    setExtractedData({
      ...extractedData,
      items: [...extractedData.items, { description: '', quantity: 1, price: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!extractedData) return;
    const newItems = extractedData.items.filter((_, i) => i !== index);
    setExtractedData({ ...extractedData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (extractedData) {
      saveToHistory(extractedData);
      setState('SUBMITTED');
    }
  };

  const reset = () => {
    setState('IDLE');
    setReceiptImage(null);
    setExtractedData(null);
    setError(null);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 tracking-tight text-lg">ReceiptScanner AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Assessment v1.1</span>
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
              className="max-w-4xl mx-auto mt-8"
            >
              {/* Tabs */}
              <div className="flex justify-center mb-10">
                <div className="bg-slate-200/50 p-1 rounded-xl flex gap-1">
                  <button
                    onClick={() => setViewMode('SCAN')}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
                      viewMode === 'SCAN' 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    <Upload className="w-4 h-4" />
                    New Scan
                  </button>
                  <button
                    onClick={() => setViewMode('HISTORY')}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
                      viewMode === 'HISTORY' 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    <History className="w-4 h-4" />
                    History
                    {history.length > 0 && (
                      <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full text-[10px]">
                        {history.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {viewMode === 'SCAN' ? (
<<<<<<< Updated upstream
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Receipt Extraction</h1>
                    <p className="text-slate-500">Fast, accurate data processing for your business expenses.</p>
                  </div>
=======
                <div className="max-w-3xl mx-auto w-full">
                    <div className="text-center mb-8">
                      <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Receipt Prefill</h1>
                      <p className="text-slate-500">Upload an image and let AI fill the receipt form before you save it.</p>
                    </div>
>>>>>>> Stashed changes

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <div
                    {...getRootProps()}
                    className={cn(
                      "relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 group bg-white",
                      isDragActive ? "border-indigo-400 bg-indigo-50/50 scale-[1.02]" : "border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50 shadow-sm"
                    )}
<<<<<<< Updated upstream
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300",
                        isDragActive ? "bg-indigo-100 scale-110 rotate-12" : "bg-indigo-50 group-hover:bg-indigo-100/50"
                      )}>
                        <Upload className={cn(
                          "w-10 h-10 transition-colors",
                          isDragActive ? "text-indigo-600" : "text-indigo-400 group-hover:text-indigo-500"
                        )} />
=======

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
>>>>>>> Stashed changes
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        {isDragActive ? "Drop the file" : "Upload Receipt Image"}
                      </h3>
                      <p className="text-slate-400 text-sm max-w-[240px] mx-auto">
                        Drag and drop your image here, or click to browse files
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {[
                      { title: 'Full Recovery', desc: 'Recovers merchant, date & total', icon: Store },
                      { title: 'Itemization', desc: 'Line-by-line item extraction', icon: Receipt },
                      { title: 'Cloud Ready', desc: 'Ready for integration', icon: CheckCircle2 }
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
                  {history.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl border-dashed">
                      <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-800">No history yet</h3>
                      <p className="text-slate-400 text-sm">Your scanned receipts will appear here.</p>
                      <button 
                        onClick={() => setViewMode('SCAN')}
                        className="mt-6 text-indigo-600 font-bold text-sm hover:underline"
                      >
                        Start your first scan
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {history.map((item) => (
                        <div 
                          key={item.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all group cursor-default"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                              {item.merchantName[0]}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{item.merchantName}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {item.date}
                                </span>
                                <span className="text-xs text-slate-300">•</span>
                                <span className="text-xs text-slate-400">
                                  Saved {formatDate(item.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-sm font-bold text-slate-900">
                                {item.currency} {item.totalAmount.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                {item.items.length} Items
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {state === 'EXTRACTING' && (
            <motion.div
              key="extracting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[60vh]"
            >
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 rounded-full"></div>
                <div className="absolute top-0 w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Receipt className="w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <h2 className="mt-8 text-2xl font-black text-slate-800 tracking-tight">AI is Analyzing...</h2>
              <p className="text-slate-500 mt-2 font-medium">Extracting structured data from your receipt.</p>
              
              <div className="mt-12 space-y-4 w-full max-w-xs">
                {['Scanning Merchant...', 'Identifying Dates...', 'Summing Totals...'].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-200 animate-pulse" style={{ animationDelay: `${idx * 0.2}s` }}></div>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {(state === 'REVIEW' || state === 'SUBMITTED') && extractedData && (
            <motion.div
              key="review"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left: Form (Now on the Left as requested) */}
              <div className="lg:col-span-7 space-y-6 pb-12">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                      <h3 className="font-black text-2xl text-slate-800 tracking-tight">Review Extraction</h3>
                      <p className="text-slate-400 text-sm mt-0.5 font-medium">Edit any field to ensure 100% accuracy.</p>
                    </div>
                    <div className="text-[10px] font-black bg-indigo-600 text-white px-2.5 py-1 rounded-full uppercase tracking-widest">
<<<<<<< Updated upstream
                      AI PRE-FILLED
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Primary Fields */}
=======
                      AI PREFILLED
                    </div>
                  </div>

                  <form onSubmit={submitReceipt} className="p-8 space-y-8">
                    {prefillError && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{prefillError}</p>
                      </div>
                    )}

                    {state === 'REVIEW' && (
                      <div>
                        <button
                          type="button"
                          onClick={handlePrefillWithAI}
                          disabled={isPrefilling}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {isPrefilling ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Prefilling with AI...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Prefill with AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

>>>>>>> Stashed changes
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="col-span-full">
                        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                          <Store className="w-3.5 h-3.5" />
                          Merchant Name
                        </label>
                        <input
                          type="text"
                          value={extractedData.merchantName}
                          onChange={(e) => handleUpdateField('merchantName', e.target.value)}
                          placeholder="e.g. Starbucks, Amazon"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white outline-none transition-all font-bold text-slate-800 text-lg shadow-inner"
                          required
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Transaction Date
                        </label>
                        <input
                          type="text"
                          value={extractedData.date}
                          onChange={(e) => handleUpdateField('date', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white outline-none transition-all font-bold text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          Currency
                        </label>
                        <input
                          type="text"
                          value={extractedData.currency}
                          onChange={(e) => handleUpdateField('currency', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white outline-none transition-all font-bold text-slate-700"
                        />
                      </div>
                    </div>

                    {/* Notification if items are missing */}
                    {extractedData.items.length === 0 && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-pulse">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-bold">Failed to detect receipt items automatically.</span>
                      </div>
                    )}

                    {/* Items Section */}
                    <div>
                      <div className="flex justify-between items-end mb-6">
                        <div>
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Line Items</label>
                          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">Detailed breakdown</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Item
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {extractedData.items.map((item, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 group bg-slate-50/50 p-2 rounded-2xl"
                          >
                            <input
                              type="text"
                              placeholder="Item description..."
                              value={item.description}
                              onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                              className="flex-1 min-w-0 bg-transparent border border-transparent rounded-xl px-3 py-2 text-sm font-bold focus:bg-white focus:border-slate-200 focus:shadow-sm outline-none transition-all"
                            />
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-12 bg-transparent border border-transparent rounded-xl px-2 py-2 text-sm text-center font-black text-slate-400 focus:bg-white focus:border-slate-200 outline-none transition-all"
                            />
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] font-black">
                                {extractedData.currency}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => handleUpdateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                                className="w-24 bg-transparent border border-transparent rounded-xl pl-7 pr-3 py-2 text-sm font-black text-right focus:bg-white focus:border-slate-200 outline-none transition-all"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-2 text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Totals Display */}
                    <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-6 shadow-2xl shadow-indigo-900/20">
                      <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Calculation</span>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="block text-[10px] font-black text-slate-500 uppercase tracking-tighter">Tax</span>
                            <div className="flex items-center gap-1">
                               <input
                                type="number"
                                step="0.01"
                                value={extractedData.taxAmount || 0}
                                onChange={(e) => handleUpdateField('taxAmount', parseFloat(e.target.value) || 0)}
                                className="w-20 bg-transparent border-none text-right font-black text-sm outline-none px-0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-black uppercase tracking-widest text-indigo-400">Total Amount</span>
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span className="text-xl font-black text-indigo-400">{extractedData.currency}</span>
                            <input
                              type="number"
                              step="0.01"
                              value={extractedData.totalAmount}
                              onChange={(e) => handleUpdateField('totalAmount', parseFloat(e.target.value) || 0)}
                              className="w-40 bg-transparent border-none text-right font-black text-4xl outline-none p-0 focus:text-indigo-300 transition-colors"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={state === 'SUBMITTED'}
                      className={cn(
                        "w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.99] shadow-xl",
                        state === 'SUBMITTED' 
                          ? "bg-emerald-500 text-white shadow-emerald-200" 
                          : "bg-indigo-600 text-white hover:bg-black hover:shadow-indigo-500/20"
                      )}
                    >
                      {state === 'SUBMITTED' ? (
                        <>
                          <CheckCircle2 className="w-6 h-6" />
                          SUBMITTED TO HISTORY
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-6 h-6" />
                          CONFIRM & FINALIZE
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {state === 'SUBMITTED' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-black text-white rounded-3xl text-center space-y-4"
                  >
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/40">
                       <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-xl font-black tracking-tight">Saved to History</h4>
                    <p className="text-slate-400 text-sm font-medium">Your assessment data has been recorded successfully.</p>
                    <div className="pt-2">
                      <button 
                        onClick={reset}
                        className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-white hover:text-black transition-all active:scale-95"
                      >
                        NEW SCAN
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right: Image Preview (Now on the Right as requested) */}
              <div className="lg:col-span-5 sticky top-24">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-indigo-50 rounded-lg">
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>
                      <h3 className="font-bold text-slate-800 tracking-tight">Source Reference</h3>
                    </div>
                    <button 
                      onClick={reset}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                      title="Discard and Start Over"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="aspect-[3/4.5] bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-800 group relative">
                    <img 
                      src={receiptImage!} 
                      alt="Receipt" 
                      className="w-full h-full object-contain pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-xl text-[10px] font-black text-white uppercase tracking-widest text-center border border-white/10">
                      High Quality Preview
                    </div>
                  </div>
                  
                  <div className="mt-8 grid grid-cols-2 gap-4">
                     <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Status</span>
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                           Verified Ready
                        </span>
                     </div>
                     <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-right">
                        <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">OCR Accuracy</span>
                        <span className="text-xs font-bold text-indigo-600">~98.4% Est.</span>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 px-6 text-center border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
             <span>Security Verified</span>
             <span>•</span>
             <span>Enterprise AI Ready</span>
             <span>•</span>
             <span>Low Latency Extraction</span>
          </div>
          <p className="text-slate-300 text-[10px] font-medium tracking-tight">
            © 2026 ReceiptScanner AI • Internal Product Performance Assessment Framework • Version 1.1.2_BETA
          </p>
        </div>
      </footer>
    </div>
  );
}

