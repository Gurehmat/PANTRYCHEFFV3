import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, Check, Plus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { usePantryStore } from '../store/pantryStore';
import { aiRateLimiter } from '../utils/rateLimiter';
import type { GeminiScanResultItem } from '../types/ai';

export default function PantryScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scannedItems, setScannedItems] = useState<GeminiScanResultItem[]>([]);
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { addItems } = usePantryStore();

  useEffect(() => {
    if (!aiRateLimiter.canMakeRequest()) {
      const update = () => {
        const ms = aiRateLimiter.getTimeUntilNextSlot();
        setRateLimitSeconds(ms > 0 ? Math.ceil(ms / 1000) : 0);
      };
      update();
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    }
    setRateLimitSeconds(0);
  }, [rateLimitSeconds, analyzing]);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 1024;
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
    if (!file?.type?.startsWith('image/')) return;
    try {
      const resizedImage = await resizeImage(file);
      setImage(resizedImage);
    } catch (err) {
      console.error('Error resizing image:', err);
      alert('Failed to process image. Please try again.');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) await processFile(file);
  };

  const analyzeImage = async () => {
    if (!image) return;
    if (!aiRateLimiter.canMakeRequest()) {
      const waitMs = aiRateLimiter.getTimeUntilNextSlot();
      alert(`Too many requests. Try again in ${Math.ceil(waitMs / 1000)} seconds.`);
      return;
    }
    setAnalyzing(true);
    try {
      const base64Image = image.split(',')[1];
      const { data, error } = await supabase.functions.invoke('scan-pantry', {
        body: { image: base64Image },
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (error) {
        let detail = error.message || 'Unknown error';
        const ctx = error.context as { body?: () => Promise<unknown> } | undefined;
        if (ctx?.body) {
          try {
            const errBody = (await ctx.body()) as { error?: string };
            detail = errBody.error ?? detail;
          } catch {
            // ignore
          }
        }
        console.error('Scan function error detail:', detail);
        throw new Error(detail);
      }
      aiRateLimiter.recordRequest();
      const items = Array.isArray(data) ? (data as GeminiScanResultItem[]) : [];
      setScannedItems(items);
      setStep('review');
    } catch (err) {
      console.error('Scan failed:', err);
      alert(`Scan failed: ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    await addItems(scannedItems);
    setIsOpen(false);
    setStep('upload');
    setImage(null);
    setScannedItems([]);
  };

  const removeItem = (index: number) => {
    setScannedItems(scannedItems.filter((_, i) => i !== index));
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-3 rounded-xl hover:bg-orange-600 transition-colors shadow-sm font-medium"
      >
        <Camera className="w-5 h-5" />
        Scan Fridge
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 sm:p-4">
      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-w-lg sm:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white flex-shrink-0">
          <h3 className="font-semibold text-lg">Add from Photo</h3>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'upload' ? (
            <div className="space-y-6 h-full flex flex-col justify-center">
              {image ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-auto max-h-[60vh] shadow-inner flex items-center justify-center">
                  <img src={image} alt="Preview" className="max-w-full max-h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 bg-white/90 p-2 rounded-full hover:bg-white text-gray-700 shadow-sm backdrop-blur-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-gray-500 cursor-pointer transition-all flex-1 min-h-[250px] ${
                      isDragging
                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                        : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                    }`}
                  >
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-500">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {isDragging ? 'Drop photo here' : 'Drop a photo or tap to choose'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Drag & drop on desktop • Tap to take photo or pick from gallery on mobile
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cameraInputRef.current?.click();
                        }}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 active:scale-95"
                      >
                        Take Photo
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 active:scale-95"
                      >
                        From Gallery
                      </button>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                  />
                </>
              )}
              <button
                type="button"
                disabled={!image || analyzing || !aiRateLimiter.canMakeRequest()}
                onClick={analyzeImage}
                className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Food...
                  </>
                ) : !aiRateLimiter.canMakeRequest() ? (
                  `Try again in ${rateLimitSeconds} seconds`
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Identify Ingredients
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">Found {scannedItems.length} items</h4>
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 py-1 px-2 rounded hover:bg-orange-50 transition-colors"
                >
                  Retake Photo
                </button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto border rounded-xl border-gray-100 divide-y divide-gray-100 bg-gray-50/50">
                {scannedItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="italic mb-2">No food identified.</p>
                    <p className="text-sm">Try a photo with better lighting or clearer labels.</p>
                  </div>
                ) : (
                  scannedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex flex-shrink-0 items-center justify-center text-orange-600">
                          <Check className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setScannedItems([]);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={scannedItems.length === 0}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  Add All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
