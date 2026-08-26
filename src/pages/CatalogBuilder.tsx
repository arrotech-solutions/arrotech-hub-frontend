import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Camera,
    Upload,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Plug,
    ArrowRight,
    ArrowLeft,
    Trash2,
    Plus,
    RefreshCw,
    Loader2,
    FileSpreadsheet,
    X,
    ImagePlus,
    PartyPopper,
    Download,
    Star,
} from 'lucide-react';
import toast from '../lib/notify';
import apiService from '../services/api';

type WizardStep = 0 | 1 | 2 | 3;

interface ProductImage {
    file: File;
    previewUrl: string;
}

interface ProductDraft {
    id: string;
    name: string;
    price: string;
    priceIsEstimate: boolean;
    description: string;
    category: string;
    sku: string;
    brand: string;
    availability: '' | 'Available' | 'Out of Stock';
    quantity: string;
    unit: string;
    costPrice: string;
    condition: string;
    attributes: Record<string, string>;
    images: ProductImage[];
    primaryImageIndex: number;
    status: 'pending' | 'extracting' | 'extracted' | 'error';
    error?: string;
    confidence?: number | null;
}

interface ExportResult {
    spreadsheet_id: string;
    spreadsheet_url: string;
    rows_written: number;
    csv_available?: boolean;
    csv_base64?: string;
}

const STEPS = ['Prerequisites', 'Capture', 'Review & Edit', 'Export'];
const CURRENCIES = ['KES', 'USD', 'NGN', 'UGX', 'TZS', 'GHS', 'ZAR', 'EUR', 'GBP'];
const AVAILABILITY_OPTIONS: Array<'' | 'Available' | 'Out of Stock'> = ['', 'Available', 'Out of Stock'];
const MAX_IMAGES_PER_PRODUCT = 6;
const DRAFT_STORAGE_KEY = 'catalog_builder_drafts_v2';

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyProduct = (): ProductDraft => ({
    id: uid(),
    name: '',
    price: '',
    priceIsEstimate: false,
    description: '',
    category: '',
    sku: '',
    brand: '',
    availability: '',
    quantity: '',
    unit: '',
    costPrice: '',
    condition: '',
    attributes: {},
    images: [],
    primaryImageIndex: 0,
    status: 'pending',
});

const mergeExtractedDescription = (description: string, specs: string) => {
    const parts = [description, specs].map((s) => s.trim()).filter(Boolean);
    return parts.join(parts.length > 1 ? ' — ' : '');
};

/** Downscale an image client-side to cut upload size + vision cost. Falls back
 *  to the original file (e.g. for HEIC the browser can't decode in canvas). */
async function downscaleImage(file: File, maxDim = 1280, quality = 0.85): Promise<File> {
    if (!file.type.startsWith('image/') || /heic|heif/i.test(file.type)) {
        return file;
    }
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
        if (scale >= 1) return file;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
        );
        if (!blob) return file;
        return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', {
            type: 'image/jpeg',
        });
    } catch {
        return file;
    }
}

const CatalogBuilder: React.FC = () => {
    const [step, setStep] = useState<WizardStep>(0);

    // Prerequisites
    const [statusLoading, setStatusLoading] = useState(true);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [visionReady, setVisionReady] = useState(true);

    // Drafts
    const [products, setProducts] = useState<ProductDraft[]>([]);
    const [currency, setCurrency] = useState('KES');

    // Export
    const [exportMode, setExportMode] = useState<'new' | 'append'>('new');
    const [sheetTitle, setSheetTitle] = useState('Product Catalog');
    const [existingSheets, setExistingSheets] = useState<{ id: string; name: string }[]>([]);
    const [selectedSheetId, setSelectedSheetId] = useState('');
    const [driveFolders, setDriveFolders] = useState<{ id: string; name: string }[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState('');
    const [wantCsv, setWantCsv] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState('');
    const [exportResult, setExportResult] = useState<ExportResult | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const angleFileInputRef = useRef<HTMLInputElement>(null);
    const angleCameraInputRef = useRef<HTMLInputElement>(null);
    const uploadTargetRef = useRef<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [activeProductId, setActiveProductId] = useState<string | null>(null);
    const [advancing, setAdvancing] = useState(false);

    // ── Prerequisites: status check (re-checks on focus, e.g. after OAuth) ──
    const checkStatus = useCallback(async () => {
        try {
            const res = await apiService.getCatalogStatus();
            if (res.success && res.data) {
                setGoogleConnected(!!res.data.google_workspace_connected);
                setVisionReady(!!res.data.vision_ready);
            }
        } catch {
            // Leave defaults; the gate stays closed if we can't confirm.
        } finally {
            setStatusLoading(false);
        }
    }, []);

    useEffect(() => {
        checkStatus();
        const onFocus = () => checkStatus();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [checkStatus]);

    // ── Restore text drafts (survive an OAuth redirect). Images are ephemeral. ──
    useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                if (Array.isArray(saved?.products) && saved.products.length) {
                    setProducts(
                        saved.products.map((p: any) => ({
                            ...p,
                            images: [],
                            status: 'extracted',
                        }))
                    );
                }
                if (saved?.currency) setCurrency(saved.currency);
            }
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        try {
            const serializable = {
                currency,
                products: products.map(({ images, ...rest }) => rest),
            };
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(serializable));
        } catch {
            /* ignore quota errors */
        }
    }, [products, currency]);

    // ── Capture: group multiple photos into ONE product (angles) ──
    const addFilesToProduct = useCallback(async (productId: string, fileList: FileList | File[]) => {
        const files = Array.from(fileList).filter(
            (f) => f.type.startsWith('image/') || /heic|heif/i.test(f.name)
        );
        if (!files.length) {
            toast.error('Please choose image files');
            return;
        }

        const newImages: ProductImage[] = [];
        for (const file of files) {
            const scaled = await downscaleImage(file);
            newImages.push({ file: scaled, previewUrl: URL.createObjectURL(scaled) });
        }

        setProducts((prev) => {
            const product = prev.find((p) => p.id === productId);
            if (!product) return prev;
            const remaining = MAX_IMAGES_PER_PRODUCT - product.images.length;
            if (remaining <= 0) {
                toast.error(`Max ${MAX_IMAGES_PER_PRODUCT} photos per product`);
                return prev;
            }
            const toAdd = newImages.slice(0, remaining);
            if (toAdd.length < newImages.length) {
                toast(`Only ${remaining} more angle(s) fit on this product`, { icon: 'ℹ️' });
            }
            return prev.map((p) =>
                p.id === productId
                    ? {
                          ...p,
                          images: [...p.images, ...toAdd],
                          status: p.status === 'extracting' ? p.status : 'pending',
                      }
                    : p
            );
        });
    }, []);

    const addFilesToActiveProduct = useCallback(
        async (fileList: FileList | File[]) => {
            let productId = activeProductId;
            if (!productId || !products.some((p) => p.id === productId)) {
                const draft = emptyProduct();
                productId = draft.id;
                setProducts((prev) => [...prev, draft]);
                setActiveProductId(productId);
            }
            await addFilesToProduct(productId, fileList);
        },
        [activeProductId, products, addFilesToProduct]
    );

    const openAngleCapture = (productId: string, useCamera: boolean) => {
        uploadTargetRef.current = productId;
        setActiveProductId(productId);
        if (useCamera) angleCameraInputRef.current?.click();
        else angleFileInputRef.current?.click();
    };

    const handleAngleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        const targetId = uploadTargetRef.current;
        if (targetId) await addFilesToProduct(targetId, files);
        else await addFilesToActiveProduct(files);
        e.target.value = '';
    };

    const startNewProduct = () => {
        const draft = emptyProduct();
        setProducts((prev) => [...prev, draft]);
        setActiveProductId(draft.id);
    };

    const extractForProduct = useCallback(
        async (productId: string, images: ProductImage[]) => {
            if (!images.length) {
                toast.error('Add at least one photo before analysing');
                return;
            }
            setProducts((prev) =>
                prev.map((p) => (p.id === productId ? { ...p, status: 'extracting', error: undefined } : p))
            );
            try {
                const res = await apiService.extractProductFromImages(
                    images.map((i) => i.file),
                    currency
                );
                if (res.success && res.data) {
                    const d = res.data;
                    const mergedDescription = mergeExtractedDescription(d.description || '', d.specs || '');
                    setProducts((prev) => {
                        const existingSkus = new Set(prev.map((pr) => pr.sku).filter(Boolean));
                        let newSku = d.suggested_sku || prev.find(pr => pr.id === productId)?.sku;
                        if (!newSku || existingSkus.has(newSku)) {
                            const catPrefix = (d.category || prev.find(pr => pr.id === productId)?.category || 'PROD').substring(0, 3).toUpperCase();
                            newSku = `${catPrefix}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                        }
                        
                        return prev.map((p) =>
                            p.id === productId
                                ? {
                                      ...p,
                                      name: d.name || p.name,
                                      description: mergedDescription || p.description,
                                      category: d.category || p.category,
                                      brand: d.brand || p.brand,
                                      sku: newSku,
                                      price:
                                          d.price_estimate != null
                                              ? String(d.price_estimate)
                                              : p.price,
                                      priceIsEstimate: d.price_estimate != null,
                                      unit: d.unit_of_measure || p.unit,
                                      condition: d.condition || p.condition,
                                      attributes: { ...p.attributes, ...(d.attributes || {}) },
                                      confidence: d.confidence ?? null,
                                      status: 'extracted',
                                  }
                                : p
                        )
                    });
                } else {
                    throw new Error((res as any).message || 'Extraction failed');
                }
            } catch (e: any) {
                const msg = e?.response?.data?.detail || e?.message || 'Extraction failed';
                setProducts((prev) =>
                    prev.map((p) => (p.id === productId ? { ...p, status: 'error', error: msg } : p))
                );
                toast.error(`Could not read product: ${msg}`);
            }
        },
        [currency]
    );

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length) addFilesToActiveProduct(e.dataTransfer.files);
    };

    const updateProduct = (id: string, patch: Partial<ProductDraft>) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    };

    const removeProduct = (id: string) => {
        setProducts((prev) => {
            const target = prev.find((p) => p.id === id);
            target?.images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
            return prev.filter((p) => p.id !== id);
        });
        if (activeProductId === id) setActiveProductId(null);
    };

    const removeImageFromProduct = (productId: string, imageIndex: number) => {
        setProducts((prev) =>
            prev.map((p) => {
                if (p.id !== productId) return p;
                const img = p.images[imageIndex];
                if (img) URL.revokeObjectURL(img.previewUrl);
                const images = p.images.filter((_, i) => i !== imageIndex);
                let primaryImageIndex = p.primaryImageIndex;
                if (imageIndex === primaryImageIndex) primaryImageIndex = 0;
                else if (imageIndex < primaryImageIndex) primaryImageIndex -= 1;
                if (primaryImageIndex >= images.length) primaryImageIndex = Math.max(0, images.length - 1);
                return {
                    ...p,
                    images,
                    primaryImageIndex,
                    status: images.length && p.status !== 'extracting' ? 'pending' : p.status,
                };
            })
        );
    };

    const setPrimaryImage = (productId: string, imageIndex: number) => {
        updateProduct(productId, { primaryImageIndex: imageIndex });
    };

    const addBlankProduct = () => {
        const draft = emptyProduct();
        draft.status = 'extracted';
        setProducts((prev) => [...prev, draft]);
    };

    // ── Export ──
    const loadFolders = useCallback(async () => {
        try {
            const res = await apiService.listDriveFolders();
            if (res.success && Array.isArray(res.data)) {
                setDriveFolders(res.data);
            }
        } catch {
            /* ignore */
        }
    }, []);

    const loadSheets = useCallback(async () => {
        try {
            const res = await apiService.listCatalogSheets(selectedFolderId || undefined);
            if (res.success && Array.isArray(res.data)) {
                setExistingSheets(res.data);
                if (res.data.length && !selectedSheetId) setSelectedSheetId(res.data[0].id);
                // Clear selected sheet if it's no longer in the list (e.g., changed folder)
                if (selectedSheetId && !res.data.find((s) => s.id === selectedSheetId)) {
                    setSelectedSheetId(res.data.length ? res.data[0].id : '');
                }
            }
        } catch {
            /* ignore */
        }
    }, [selectedFolderId, selectedSheetId]);

    useEffect(() => {
        if (step === 3) {
            loadFolders();
        }
    }, [step, loadFolders]);

    useEffect(() => {
        if (step === 3 && exportMode === 'append') loadSheets();
    }, [step, exportMode, selectedFolderId, loadSheets]);

    const validProducts = products.filter((p) => p.name.trim());
    const productsWithoutAvailability = validProducts.filter((p) => !p.availability);

    const handleExport = async () => {
        if (!googleConnected) {
            toast.error('Connect Google Workspace first');
            return;
        }
        if (!validProducts.length) {
            toast.error('Add at least one product with a name');
            return;
        }
        if (productsWithoutAvailability.length) {
            toast.error(`Set availability for ${productsWithoutAvailability.length} product(s) before exporting`);
            return;
        }
        if (exportMode === 'append' && !selectedSheetId) {
            toast.error('Select a spreadsheet to append to');
            return;
        }

        setExporting(true);
        setExportProgress('Uploading photos and writing rows…');

        // Build files list + map each product to its primary catalog photo.
        const files: File[] = [];
        const payloadProducts = validProducts.map((p) => {
            let imageIndex: number | undefined;
            const primaryIdx = Math.min(p.primaryImageIndex ?? 0, Math.max(0, p.images.length - 1));
            const primaryImage = p.images[primaryIdx];
            if (primaryImage) {
                imageIndex = files.length;
                files.push(primaryImage.file);
            }
            return {
                name: p.name.trim(),
                price: p.price,
                cost_price: p.costPrice,
                description: p.description,
                category: p.category,
                sku: p.sku,
                brand: p.brand,
                availability: p.availability,
                quantity: p.quantity,
                unit: p.unit,
                condition: p.condition,
                attributes: p.attributes,
                image_index: imageIndex,
            };
        });

        try {
            const res = await apiService.exportCatalog(
                {
                    products: payloadProducts,
                    mode: exportMode,
                    title: sheetTitle,
                    spreadsheet_id: exportMode === 'append' ? selectedSheetId : undefined,
                    folder_id: selectedFolderId || undefined,
                    want_csv: wantCsv,
                },
                files
            );
            if (res.success && res.data) {
                setExportResult(res.data);
                toast.success(`Exported ${res.data.rows_written} product(s)`);
                localStorage.removeItem(DRAFT_STORAGE_KEY);
            } else {
                throw new Error((res as any).message || 'Export failed');
            }
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || 'Export failed';
            toast.error(msg);
        } finally {
            setExporting(false);
            setExportProgress('');
        }
    };

    const downloadCsv = () => {
        if (!exportResult?.csv_base64) return;
        const link = document.createElement('a');
        link.href = `data:text/csv;base64,${exportResult.csv_base64}`;
        link.download = `${sheetTitle || 'product-catalog'}.csv`;
        link.click();
    };

    const resetWizard = () => {
        products.forEach((p) => p.images.forEach((img) => URL.revokeObjectURL(img.previewUrl)));
        setProducts([]);
        setExportResult(null);
        setStep(1);
    };

    const productsWithPhotos = products.filter((p) => p.images.length > 0);

    const canProceedFromStep = (): boolean => {
        if (step === 0) return googleConnected && visionReady;
        if (step === 1) return productsWithPhotos.length > 0;
        if (step === 2) return validProducts.length > 0;
        return true;
    };

    const goToNextStep = async () => {
        if (step === 1) {
            if (!productsWithPhotos.length) {
                toast.error('Add at least one product photo');
                return;
            }
            const pending = productsWithPhotos.filter(
                (p) => p.status === 'pending' || p.status === 'error'
            );
            if (pending.length) {
                setAdvancing(true);
                try {
                    await Promise.all(pending.map((p) => extractForProduct(p.id, p.images)));
                } finally {
                    setAdvancing(false);
                }
            }
            setProducts((prev) => prev.filter((p) => p.images.length > 0));
        }
        setStep((s) => (s + 1) as WizardStep);
    };

    const extractingCount = products.filter((p) => p.status === 'extracting').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary-800 to-primary-500 flex items-center justify-center shadow-lg">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Catalog Builder</h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            Turn product photos into a sellable Google Sheet for your ordering agent
                        </p>
                    </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 flex-wrap">
                    {STEPS.map((label, index) => (
                        <div key={label} className="flex items-center">
                            <div
                                className={`flex items-center gap-2 ${
                                    index <= step
                                        ? 'text-purple-600 dark:text-purple-400'
                                        : 'text-gray-400 dark:text-slate-500'
                                }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                                        index < step
                                            ? 'bg-purple-600 border-purple-600 text-white'
                                            : index === step
                                            ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                                            : 'border-gray-300 dark:border-slate-600'
                                    }`}
                                >
                                    {index < step ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                                </div>
                                <span className="hidden sm:inline text-sm font-semibold">{label}</span>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className="w-6 sm:w-10 h-0.5 mx-1 sm:mx-2 bg-gray-200 dark:bg-slate-700" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Content card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-5 sm:p-7 min-h-[360px]">
                    {/* STEP 0 — Prerequisites */}
                    {step === 0 && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Before you start</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                                We host your product photos on your Google Drive and write rows to a Google Sheet, so a
                                Google Workspace connection is required.
                            </p>

                            {statusLoading ? (
                                <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
                                    <Loader2 className="w-5 h-5 animate-spin" /> Checking connections…
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Google Workspace */}
                                    <div className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 dark:text-white">Google Workspace</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                                    Drive (photo hosting) + Sheets (catalog)
                                                </p>
                                            </div>
                                        </div>
                                        {googleConnected ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 flex-shrink-0">
                                                <CheckCircle2 className="w-4 h-4" /> CONNECTED
                                            </span>
                                        ) : (
                                            <Link
                                                to="/connections"
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors flex-shrink-0"
                                            >
                                                <Plug className="w-4 h-4" /> CONNECT
                                            </Link>
                                        )}
                                    </div>

                                    {/* Vision readiness (only flag if missing) */}
                                    {!visionReady && (
                                        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">AI vision key</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                                        Add an OpenAI key in Settings to enable photo extraction.
                                                    </p>
                                                </div>
                                            </div>
                                            <Link
                                                to="/settings"
                                                className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex-shrink-0"
                                            >
                                                SETTINGS
                                            </Link>
                                        </div>
                                    )}

                                    {!googleConnected && (
                                        <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 mt-2">
                                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>Connect Google Workspace to continue. After connecting, return here — we'll detect it automatically.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 1 — Capture */}
                    {step === 1 && (
                        <div>
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Capture your products</h2>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">
                                        Add several angles per product — AI combines details from every photo.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Currency</label>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-500"
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Upload zone — all selected files go to the active product */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-colors ${
                                    isDragging
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                                        : 'border-gray-300 dark:border-slate-600'
                                }`}
                            >
                                <ImagePlus className="w-10 h-10 mx-auto text-purple-500 mb-3" />
                                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                                    Add photos to the current product
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
                                    Select or capture multiple angles at once (up to {MAX_IMAGES_PER_PRODUCT} per product).
                                    Each angle can reveal different labels, specs, or features.
                                </p>
                                <div className="flex items-center justify-center gap-3 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            uploadTargetRef.current = activeProductId;
                                            fileInputRef.current?.click();
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-secondary-800 to-primary-500 text-white font-semibold text-sm"
                                    >
                                        <Upload className="w-4 h-4" /> Upload angles
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            uploadTargetRef.current = activeProductId;
                                            cameraInputRef.current?.click();
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 font-semibold text-sm"
                                    >
                                        <Camera className="w-4 h-4" /> Take photo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={startNewProduct}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 font-semibold text-sm"
                                    >
                                        <Plus className="w-4 h-4" /> New product
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) addFilesToActiveProduct(e.target.files);
                                        e.target.value = '';
                                    }}
                                />
                                <input
                                    ref={cameraInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) addFilesToActiveProduct(e.target.files);
                                        e.target.value = '';
                                    }}
                                />
                                <input
                                    ref={angleFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleAngleFilesSelected}
                                />
                                <input
                                    ref={angleCameraInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handleAngleFilesSelected}
                                />
                            </div>

                            {/* Product cards with multiple angles */}
                            {products.length > 0 ? (
                                <div className="mt-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                                            {products.length} product(s)
                                            {extractingCount > 0 && (
                                                <span className="text-purple-600 dark:text-purple-400 ml-1">
                                                    · analysing {extractingCount}…
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    {products.map((p, productIdx) => {
                                        const isActive = p.id === activeProductId;
                                        return (
                                            <div
                                                key={p.id}
                                                className={`rounded-xl border p-4 transition-colors ${
                                                    isActive
                                                        ? 'border-purple-400 bg-purple-50/50 dark:bg-purple-500/10 dark:border-purple-500/50'
                                                        : 'border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                            Product {productIdx + 1}
                                                            {isActive && (
                                                                <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                                            {p.images.length}/{MAX_IMAGES_PER_PRODUCT} angle(s)
                                                            {p.name ? ` · ${p.name}` : ''}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProduct(p.id)}
                                                        className="text-gray-400 hover:text-red-500"
                                                        title="Remove product"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex gap-2 overflow-x-auto pb-1">
                                                    {p.images.map((img, imgIdx) => (
                                                        <div key={imgIdx} className="relative flex-shrink-0">
                                                            <img
                                                                src={img.previewUrl}
                                                                alt={`Angle ${imgIdx + 1}`}
                                                                className="w-20 h-20 rounded-lg object-cover border border-gray-200 dark:border-slate-600"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeImageFromProduct(p.id, imgIdx)}
                                                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                            <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/50 text-white px-1 rounded">
                                                                {imgIdx + 1}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {p.images.length < MAX_IMAGES_PER_PRODUCT && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openAngleCapture(p.id, false)}
                                                            className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-500"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                            <span className="text-[10px] mt-0.5">Angle</span>
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveProductId(p.id)}
                                                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                                                            isActive
                                                                ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                                                                : 'border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {isActive ? 'Receiving uploads' : 'Select'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openAngleCapture(p.id, true)}
                                                        disabled={p.images.length >= MAX_IMAGES_PER_PRODUCT}
                                                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 disabled:opacity-40"
                                                    >
                                                        <Camera className="w-3 h-3" /> Camera
                                                    </button>
                                                    {p.images.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => extractForProduct(p.id, p.images)}
                                                            disabled={p.status === 'extracting'}
                                                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-600 text-white disabled:opacity-50"
                                                        >
                                                            {p.status === 'extracting' ? (
                                                                <>
                                                                    <Loader2 className="w-3 h-3 animate-spin" /> Analysing…
                                                                </>
                                                            ) : p.status === 'extracted' ? (
                                                                <>
                                                                    <RefreshCw className="w-3 h-3" /> Re-analyse
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Sparkles className="w-3 h-3" /> Analyse angles
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                    {p.status === 'extracted' && p.name && (
                                                        <span className="text-xs text-green-600 dark:text-green-400 truncate max-w-[180px]">
                                                            {p.name}
                                                        </span>
                                                    )}
                                                    {p.status === 'error' && (
                                                        <span className="text-xs text-red-500">Analysis failed — retry</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-4">
                                    Upload photos above to start your first product, or tap <strong>New product</strong>.
                                </p>
                            )}
                        </div>
                    )}

                    {/* STEP 2 — Review & edit */}
                    {step === 2 && (
                        <div>
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Review & edit</h2>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">
                                        Confirm the details. Prices are AI estimates — please verify.
                                    </p>
                                </div>
                                <button
                                    onClick={addBlankProduct}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-semibold text-gray-700 dark:text-slate-200"
                                >
                                    <Plus className="w-4 h-4" /> Add product
                                </button>
                            </div>

                            <div className="space-y-4">
                                {products.map((p) => (
                                    <div
                                        key={p.id}
                                        className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 bg-gray-50/50 dark:bg-slate-800/50"
                                    >
                                        <div className="flex gap-4">
                                            {/* Angles — tap star for catalog cover photo */}
                                            <div className="flex-shrink-0 w-28 sm:w-32">
                                                <p className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 mb-1">
                                                    Angles ({p.images.length})
                                                </p>
                                                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                                                    {p.images.map((img, imgIdx) => (
                                                        <div key={imgIdx} className="relative">
                                                            <img
                                                                src={img.previewUrl}
                                                                alt={`Angle ${imgIdx + 1}`}
                                                                className={`w-full h-14 rounded-lg object-cover border-2 ${
                                                                    (p.primaryImageIndex ?? 0) === imgIdx
                                                                        ? 'border-purple-500'
                                                                        : 'border-gray-200 dark:border-slate-700'
                                                                }`}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setPrimaryImage(p.id, imgIdx)}
                                                                title="Use as catalog cover photo"
                                                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                                                                    (p.primaryImageIndex ?? 0) === imgIdx
                                                                        ? 'bg-purple-600 text-white'
                                                                        : 'bg-black/40 text-white/80'
                                                                }`}
                                                            >
                                                                <Star className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                {p.images.length > 0 && p.status !== 'extracting' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => extractForProduct(p.id, p.images)}
                                                        className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 mt-1.5"
                                                    >
                                                        <RefreshCw className="w-3 h-3" /> Re-analyse all angles
                                                    </button>
                                                )}
                                            </div>

                                            {/* Fields */}
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="sm:col-span-2">
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                                        Name *
                                                    </label>
                                                    <input
                                                        value={p.name}
                                                        onChange={(e) => updateProduct(p.id, { name: e.target.value })}
                                                        placeholder="e.g. Sony WH-1000XM4 Headphones"
                                                        className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                                        Price ({currency})
                                                        {p.priceIsEstimate && (
                                                            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                                                                AI estimate — confirm
                                                            </span>
                                                        )}
                                                    </label>
                                                    <input
                                                        value={p.price}
                                                        onChange={(e) =>
                                                            updateProduct(p.id, { price: e.target.value, priceIsEstimate: false })
                                                        }
                                                        placeholder="0"
                                                        inputMode="decimal"
                                                        className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                                        Category
                                                    </label>
                                                    <input
                                                        value={p.category}
                                                        onChange={(e) => updateProduct(p.id, { category: e.target.value })}
                                                        placeholder="e.g. Audio"
                                                        className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Brand</label>
                                                    <input
                                                        value={p.brand}
                                                        onChange={(e) => updateProduct(p.id, { brand: e.target.value })}
                                                        placeholder="e.g. Sony"
                                                        className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">SKU</label>
                                                    <input
                                                        value={p.sku}
                                                        onChange={(e) => updateProduct(p.id, { sku: e.target.value })}
                                                        placeholder="e.g. HEADSET-001"
                                                        className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                                        Availability *
                                                    </label>
                                                    <select
                                                        value={p.availability}
                                                        onChange={(e) =>
                                                            updateProduct(p.id, {
                                                                availability: e.target.value as ProductDraft['availability'],
                                                            })
                                                        }
                                                        className={`w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 ${
                                                            !p.availability
                                                                ? 'border-amber-400 dark:border-amber-500/60 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                                                : p.availability === 'Available'
                                                                ? 'border-green-300 dark:border-green-500/40 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                                                                : 'border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                                                        } dark:bg-slate-800`}
                                                    >
                                                        {AVAILABILITY_OPTIONS.map((opt) => (
                                                            <option key={opt || '__unset'} value={opt}>
                                                                {opt || '— Select availability —'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        value={p.description}
                                                        onChange={(e) => updateProduct(p.id, { description: e.target.value })}
                                                        rows={2}
                                                        placeholder="Short sales description"
                                                        className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Quantity</label>
                                                    <input
                                                        value={p.quantity}
                                                        onChange={(e) => updateProduct(p.id, { quantity: e.target.value })}
                                                        placeholder="e.g. 50"
                                                        type="number"
                                                        className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Unit of Measure</label>
                                                    <input
                                                        value={p.unit}
                                                        onChange={(e) => updateProduct(p.id, { unit: e.target.value })}
                                                        placeholder="e.g. kg, pieces, liters"
                                                        className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Cost Price ({currency})</label>
                                                    <input
                                                        value={p.costPrice}
                                                        onChange={(e) => updateProduct(p.id, { costPrice: e.target.value })}
                                                        placeholder="0"
                                                        inputMode="decimal"
                                                        className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Condition</label>
                                                    <input
                                                        value={p.condition}
                                                        onChange={(e) => updateProduct(p.id, { condition: e.target.value })}
                                                        placeholder="e.g. New, Used, Refurbished"
                                                        className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                                            Custom Attributes
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newAttr = `Custom ${Object.keys(p.attributes).length + 1}`;
                                                                updateProduct(p.id, { attributes: { ...p.attributes, [newAttr]: '' } });
                                                            }}
                                                            className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold"
                                                        >
                                                            <Plus className="w-3 h-3" /> Add attribute
                                                        </button>
                                                    </div>
                                                    {Object.entries(p.attributes).map(([key, value], idx) => (
                                                        <div key={idx} className="flex gap-2 mb-2 items-center">
                                                            <input
                                                                value={key}
                                                                onChange={(e) => {
                                                                    const newKey = e.target.value;
                                                                    const newAttrs = { ...p.attributes };
                                                                    delete newAttrs[key];
                                                                    newAttrs[newKey] = value;
                                                                    updateProduct(p.id, { attributes: newAttrs });
                                                                }}
                                                                placeholder="Name (e.g. Color)"
                                                                className="flex-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-500"
                                                            />
                                                            <input
                                                                value={value}
                                                                onChange={(e) => {
                                                                    updateProduct(p.id, { attributes: { ...p.attributes, [key]: e.target.value } });
                                                                }}
                                                                placeholder="Value (e.g. Red)"
                                                                className="flex-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-500"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newAttrs = { ...p.attributes };
                                                                    delete newAttrs[key];
                                                                    updateProduct(p.id, { attributes: newAttrs });
                                                                }}
                                                                className="text-gray-400 hover:text-red-500 p-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {Object.keys(p.attributes).length === 0 && (
                                                        <div className="text-xs text-gray-400 dark:text-slate-500 italic">
                                                            No custom attributes yet. Add fields like Color, Size, Weight, etc.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => removeProduct(p.id)}
                                                className="flex-shrink-0 text-gray-400 hover:text-red-500 h-fit"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {!p.name.trim() && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Name is required to export this product.
                                            </p>
                                        )}
                                        {p.name.trim() && !p.availability && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Availability must be set before export.
                                            </p>
                                        )}
                                    </div>
                                ))}

                                {products.length === 0 && (
                                    <div className="text-center py-10 text-gray-500 dark:text-slate-400">
                                        No products yet. Go back to add photos.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3 — Export */}
                    {step === 3 && !exportResult && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Export to Google Sheets</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
                                {validProducts.length} product(s) ready. Photos are hosted on your Drive and linked in the sheet.
                            </p>

                            {/* Connection chip */}
                            <div className="mb-5">
                                {googleConnected ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                                        <CheckCircle2 className="w-4 h-4" /> Google Workspace connected
                                    </span>
                                ) : (
                                    <Link
                                        to="/connections"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                    >
                                        <Plug className="w-4 h-4" /> Connect Google Workspace
                                    </Link>
                                )}
                            </div>

                            {/* Mode toggle */}
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <button
                                    onClick={() => setExportMode('new')}
                                    className={`p-4 rounded-xl border text-left transition-all ${
                                        exportMode === 'new'
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                                            : 'border-gray-200 dark:border-slate-700'
                                    }`}
                                >
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">New sheet</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">Create a fresh catalog</p>
                                </button>
                                <button
                                    onClick={() => setExportMode('append')}
                                    className={`p-4 rounded-xl border text-left transition-all ${
                                        exportMode === 'append'
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                                            : 'border-gray-200 dark:border-slate-700'
                                    }`}
                                >
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Append</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">Add to an existing sheet</p>
                                </button>
                            </div>

                            {exportMode === 'new' ? (
                                <div className="mb-5 space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Sheet title</label>
                                        <input
                                            value={sheetTitle}
                                            onChange={(e) => setSheetTitle(e.target.value)}
                                            className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                            Destination folder (Optional)
                                        </label>
                                        <select
                                            value={selectedFolderId}
                                            onChange={(e) => setSelectedFolderId(e.target.value)}
                                            className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="">Root Drive (Anywhere)</option>
                                            {driveFolders.map((f) => (
                                                <option key={f.id} value={f.id}>
                                                    {f.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-5 space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                            Filter by folder (Optional)
                                        </label>
                                        <select
                                            value={selectedFolderId}
                                            onChange={(e) => setSelectedFolderId(e.target.value)}
                                            className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="">All Folders / Root</option>
                                            {driveFolders.map((f) => (
                                                <option key={f.id} value={f.id}>
                                                    {f.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                            Choose spreadsheet
                                        </label>
                                        <select
                                            value={selectedSheetId}
                                            onChange={(e) => setSelectedSheetId(e.target.value)}
                                            className="w-full mt-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="">Select a spreadsheet…</option>
                                            {existingSheets.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                        {existingSheets.length === 0 && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {selectedFolderId ? 'No spreadsheets found in this folder.' : 'No spreadsheets found in your Drive.'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={wantCsv}
                                    onChange={(e) => setWantCsv(e.target.checked)}
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                Also download a CSV copy
                            </label>

                            {exporting && (
                                <div className="mt-5 flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" /> {exportProgress}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Success screen */}
                    {step === 3 && exportResult && (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-4">
                                <PartyPopper className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Catalog created!</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                                {exportResult.rows_written} product(s) written to your Google Sheet.
                            </p>
                            <div className="flex items-center justify-center gap-3 flex-wrap">
                                <a
                                    href={exportResult.spreadsheet_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-secondary-800 to-primary-500 text-white font-semibold text-sm"
                                >
                                    <FileSpreadsheet className="w-4 h-4" /> Open Google Sheet
                                </a>
                                {exportResult.csv_available && (
                                    <button
                                        onClick={downloadCsv}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 font-semibold text-sm"
                                    >
                                        <Download className="w-4 h-4" /> Download CSV
                                    </button>
                                )}
                                <button
                                    onClick={resetWizard}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 font-semibold text-sm"
                                >
                                    <Plus className="w-4 h-4" /> Build another
                                </button>
                            </div>

                            {/* Next step: ingestion is a separate workflow */}
                            <div className="mt-8 max-w-md mx-auto rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-4 text-left">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Next step</p>
                                <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">
                                    Ingest this sheet into your knowledge base so the WhatsApp ordering agent can sell from it.
                                </p>
                                <Link
                                    to="/workflows"
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 dark:text-blue-400"
                                >
                                    Go to Workflows <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer nav */}
                {!(step === 3 && exportResult) && (
                    <div className="flex items-center justify-between mt-6">
                        <button
                            onClick={() => setStep((s) => (s > 0 ? ((s - 1) as WizardStep) : s))}
                            disabled={step === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-slate-300 disabled:opacity-40 font-semibold text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>

                        {step < 3 ? (
                            <button
                                onClick={goToNextStep}
                                disabled={!canProceedFromStep() || extractingCount > 0 || advancing}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-secondary-800 to-primary-500 text-white font-semibold text-sm disabled:opacity-40"
                            >
                                {advancing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Analysing angles…
                                    </>
                                ) : (
                                    <>
                                        <span>{step === 0 ? 'Start' : 'Next'}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleExport}
                                disabled={exporting || !canProceedFromStep() || !googleConnected}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-secondary-800 to-primary-500 text-white font-semibold text-sm disabled:opacity-40"
                            >
                                {exporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Exporting…
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="w-4 h-4" /> Export catalog
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CatalogBuilder;
