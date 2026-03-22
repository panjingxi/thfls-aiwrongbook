"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UploadZone } from "@/components/upload-zone";
import { CorrectionEditor } from "@/components/correction-editor";
import { BatchAnalyzer, BatchItem } from "@/components/batch-analyzer";
import { ImageCropper } from "@/components/image-cropper";
import { ParsedQuestion } from "@/lib/ai";
import { UserWelcome } from "@/components/user-welcome";
import { apiClient } from "@/lib/api-client";
import { AnalyzeResponse, Notebook, AppConfig } from "@/types/api";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { processImageFile } from "@/lib/image-utils";
import { Upload, BookOpen, Tags, LogOut, BarChart3, Sparkles, GraduationCap } from "lucide-react";
import { SettingsDialog } from "@/components/settings-dialog";
import { BroadcastNotification } from "@/components/broadcast-notification";
import { signOut } from "next-auth/react";

import { ProgressFeedback, ProgressStatus } from "@/components/ui/progress-feedback";
import { frontendLogger } from "@/lib/frontend-logger";

function HomeContent() {
    const [step, setStep] = useState<"upload" | "review" | "batch">("upload");
    const [batchImages, setBatchImages] = useState<File[]>([]);
    const [pendingItems, setPendingItems] = useState<BatchItem[]>([]);
    const [editingBatchItemId, setEditingBatchItemId] = useState<string | null>(null);
    const [analysisStep, setAnalysisStep] = useState<ProgressStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [parsedData, setParsedData] = useState<ParsedQuestion | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const { t, language } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialNotebookId = searchParams.get("notebook");
    const [notebooks, setNotebooks] = useState<{ id: string; name: string }[]>([]);
    const [autoSelectedNotebookId, setAutoSelectedNotebookId] = useState<string | null>(null);

    const [config, setConfig] = useState<AppConfig | null>(null);

    const [croppingImage, setCroppingImage] = useState<string | null>(null);
    const [isCropperOpen, setIsCropperOpen] = useState(false);

    // 随机励志标语
    const slogans = [
        "把每一次的错题，化作攀登卓越的阶梯。",
        "行千里者半九十，知错能改善莫大焉。",
        "书山有路勤为径，学海无涯苦作舟。",
        "宝剑锋从磨砺出，梅花香自苦寒来。",
        "每一次纠错，都是向卓越迈进的一大步。",
        "厚积薄发，行稳致远。",
        "千淘万漉虽辛苦，吹尽狂沙始到金。"
    ];
    const [currentSlogan, setCurrentSlogan] = useState("");

    useEffect(() => {
        setCurrentSlogan(slogans[Math.floor(Math.random() * slogans.length)]);
    }, []);

    // Timeout Config
    const aiTimeout = config?.timeouts?.analyze || 180000;
    const safetyTimeout = aiTimeout + 10000;

    // Cleanup Blob URL to prevent memory leak
    useEffect(() => {
        return () => {
            if (croppingImage) {
                URL.revokeObjectURL(croppingImage);
            }
        };
    }, [croppingImage]);

    useEffect(() => {
        // Fetch notebooks for auto-selection
        apiClient.get<Notebook[]>("/api/notebooks")
            .then(data => setNotebooks(data))
            .catch(err => console.error("Failed to fetch notebooks:", err));

        // Fetch settings for timeouts
        apiClient.get<AppConfig>("/api/settings")
            .then(data => {
                setConfig(data);
                if (data.timeouts?.analyze) {
                    frontendLogger.info('[Config]', 'Loaded timeout settings', {
                        analyze: data.timeouts.analyze
                    });
                }
            })
            .catch(err => console.error("Failed to fetch config:", err));
    }, []);

    // Simulate progress for smoother UX with timeout protection
    useEffect(() => {
        let interval: NodeJS.Timeout;
        let timeout: NodeJS.Timeout;
        if (analysisStep !== 'idle') {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev; // Cap at 90% until complete
                    return prev + Math.random() * 10;
                });
            }, 500);

            // Safety timeout: auto-reset after configurable time to prevent stuck overlay
            timeout = setTimeout(() => {
                console.warn('[Progress] Safety timeout triggered - resetting analysisStep');
                setAnalysisStep('idle');
            }, safetyTimeout);
        }
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [analysisStep, safetyTimeout]);

    const onImageSelect = async (file: File) => {
        if (file.type === 'application/pdf') {
            try {
                setAnalysisStep('compressing');
                const { convertPdfToImages } = await import('@/lib/pdf-utils');
                const images = await convertPdfToImages(file, 2.0);
                if (images.length === 0) {
                    alert('无法从 PDF 提取图片，可能是空文件');
                    setAnalysisStep('idle');
                    return;
                }
                setBatchImages(images);
                setPendingItems([]);
                setStep("batch");
            } catch (err) {
                console.error("PDF 处理失败:", err);
                alert('PDF 处理失败，请重试');
            } finally {
                setAnalysisStep('idle');
            }
        } else {
            const imageUrl = URL.createObjectURL(file);
            setCroppingImage(imageUrl);
            setIsCropperOpen(true);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setIsCropperOpen(false);
        // Convert Blob to File
        const file = new File([croppedBlob], "cropped-image.jpg", { type: "image/jpeg" });
        handleAnalyze(file);
    };

    const handleAnalyze = async (file: File) => {
        const startTime = Date.now();
        frontendLogger.info('[HomeAnalyze]', 'Starting analysis flow', {
            timeoutSettings: {
                apiTimeout: aiTimeout,
                safetyTimeout
            }
        });

        try {
            frontendLogger.info('[HomeAnalyze]', 'Step 1/5: Compressing image');
            setAnalysisStep('compressing');
            const base64Image = await processImageFile(file);
            setCurrentImage(base64Image);
            frontendLogger.info('[HomeAnalyze]', 'Image compressed successfully', {
                size: base64Image.length
            });

            frontendLogger.info('[HomeAnalyze]', 'Step 2/5: Calling API endpoint /api/analyze');
            setAnalysisStep('analyzing');
            const apiStartTime = Date.now();
            const data = await apiClient.post<AnalyzeResponse>("/api/analyze", {
                imageBase64: base64Image,
                language: language,
                subjectId: initialNotebookId || autoSelectedNotebookId || undefined
            }, { timeout: aiTimeout }); // Use configured timeout
            const apiDuration = Date.now() - apiStartTime;
            frontendLogger.info('[HomeAnalyze]', 'API response received, validating data', {
                apiDuration
            });

            // Validate response data
            if (!data || typeof data !== 'object') {
                frontendLogger.error('[HomeAnalyze]', 'Validation failed - invalid response data', {
                    data
                });
                throw new Error('Invalid API response: data is null or not an object');
            }
            frontendLogger.info('[HomeAnalyze]', 'Response data validated successfully');

            frontendLogger.info('[HomeAnalyze]', 'Step 3/5: Setting processing state and progress to 100%');
            setAnalysisStep('processing');
            setProgress(100);
            frontendLogger.info('[HomeAnalyze]', 'Progress updated to 100%');

            frontendLogger.info('[HomeAnalyze]', 'Step 4/5: Setting parsed data and auto-selecting notebook');
            const dataSize = JSON.stringify(data).length;
            // Auto-select notebook based on subject
            if (data.subject) {
                const matchedNotebook = notebooks.find(n =>
                    n.name.includes(data.subject!) || data.subject!.includes(n.name)
                );
                if (matchedNotebook) {
                    setAutoSelectedNotebookId(matchedNotebook.id);
                    frontendLogger.info('[HomeAnalyze]', 'Auto-selected notebook', {
                        notebook: matchedNotebook.name,
                        subject: data.subject
                    });
                }
            }
            const setDataStart = Date.now();
            setParsedData(data);
            const setDataDuration = Date.now() - setDataStart;
            frontendLogger.info('[HomeAnalyze]', 'Parsed data set successfully', {
                dataSize,
                setDataDuration
            });

            frontendLogger.info('[HomeAnalyze]', 'Step 5/5: Switching to review page');
            const setStepStart = Date.now();
            setStep("review");
            const setStepDuration = Date.now() - setStepStart;
            frontendLogger.info('[HomeAnalyze]', 'Step switched to review', {
                setStepDuration
            });
            const totalDuration = Date.now() - startTime;
            frontendLogger.info('[HomeAnalyze]', 'Analysis completed successfully', {
                totalDuration
            });
        } catch (error: any) {
            const errorDuration = Date.now() - startTime;
            frontendLogger.error('[HomeError]', 'Analysis failed', {
                errorDuration,
                error: error.message || String(error)
            });

            // 安全的错误处理逻辑，防止在报错时二次报错
            try {
                let errorMessage = t.common?.messages?.analysisFailed || 'Analysis failed, please try again';

                // ApiError 的结构：error.data.message 包含后端返回的错误类型
                const backendErrorType = error?.data?.message;

                if (backendErrorType && typeof backendErrorType === 'string') {
                    // 检查是否是已知的 AI 错误类型
                    if (t.errors && typeof t.errors === 'object' && backendErrorType in t.errors) {
                        const mappedError = (t.errors as any)[backendErrorType];
                        if (typeof mappedError === 'string') {
                            errorMessage = mappedError;
                            frontendLogger.info('[HomeError]', `Matched error type: ${backendErrorType}`, {
                                errorMessage
                            });
                        }
                    } else {
                        // 使用后端返回的具体错误消息
                        errorMessage = backendErrorType;
                        frontendLogger.info('[HomeError]', 'Using backend error message', {
                            errorMessage
                        });
                    }
                } else if (error?.message) {
                    // Fallback：检查 error.message（用于非 API 错误）
                    if (error.message.includes('fetch') || error.message.includes('network')) {
                        errorMessage = t.errors?.AI_CONNECTION_FAILED || '网络连接失败';
                    } else if (typeof error.data === 'string') {
                        frontendLogger.info('[HomeError]', 'Raw error data', {
                            errorDataPreview: error.data.substring(0, 100)
                        });
                        errorMessage += ` (${error.status || 'Error'})`;
                    }
                }

                alert(errorMessage);
            } catch (innerError) {
                frontendLogger.error('[HomeError]', 'Failed to process error message', {
                    innerError: String(innerError)
                });
                alert('Analysis failed. Please try again.');
            }
        } finally {
            // Always reset analysis state, even if setState throws
            frontendLogger.info('[HomeAnalyze]', 'Finally: Resetting analysis state to idle');
            setAnalysisStep('idle');
            frontendLogger.info('[HomeAnalyze]', 'Analysis state reset complete');
        }
    };

    const handleSave = async (finalData: ParsedQuestion & { subjectId?: string }): Promise<void> => {
        frontendLogger.info('[HomeSave]', 'Starting save process', {
            hasQuestionText: !!finalData.questionText,
            hasAnswerText: !!finalData.answerText,
            subjectId: finalData.subjectId,
            knowledgePointsCount: finalData.knowledgePoints?.length || 0,
            hasImage: !!currentImage,
            imageSize: currentImage?.length || 0,
        });

        try {
            const result = await apiClient.post<{ id: string; duplicate?: boolean }>("/api/error-items", {
                ...finalData,
                originalImageUrl: currentImage || "",
            });

            // 检查是否是重复提交（后端去重返回）
            if (result.duplicate) {
                frontendLogger.info('[HomeSave]', 'Duplicate submission detected, using existing record');
            }

            frontendLogger.info('[HomeSave]', 'Save successful');
            
            alert(t.common?.messages?.saveSuccess || 'Saved successfully!');
            
            if (editingBatchItemId) {
                // Return to batch view
                setPendingItems(prev => prev.filter(item => item.id !== editingBatchItemId));
                setEditingBatchItemId(null);
                setStep("batch");
            } else {
                setStep("upload");
            }
            
            setParsedData(null);
            setCurrentImage(null);

            // Redirect to notebook page if subjectId is present, but NOT if returning to batch
            if (finalData.subjectId && !editingBatchItemId) {
                router.push(`/notebooks/${finalData.subjectId}`);
            }
        } catch (error: any) {
            frontendLogger.error('[HomeSave]', 'Save failed', {
                errorStatus: error?.status,
                errorMessage: error?.data?.message || error?.message || String(error),
                errorData: error?.data,
            });
            alert(t.common?.messages?.saveFailed || 'Failed to save');
        }
    };

    const getProgressMessage = () => {
        switch (analysisStep) {
            case 'compressing': return t.common.progress?.compressing || "Compressing...";
            case 'uploading': return t.common.progress?.uploading || "Uploading...";
            case 'analyzing': return t.common.progress?.analyzing || "Analyzing...";
            case 'processing': return t.common.progress?.processing || "Processing...";
            default: return "";
        }
    };

    return (
        <main className="min-h-screen bg-background">
            <ProgressFeedback
                status={analysisStep}
                progress={progress}
                message={getProgressMessage()}
            />

            <div className="container mx-auto p-4 space-y-6 pb-20">
                {/* ===== 天外品牌横幅 (天外蓝 x 中国红) ===== */}
                <div className="relative overflow-hidden rounded-3xl thfls-banner apple-fade-in group hover:shadow-lg transition-all duration-500">
                    {/* 背景装饰点阵 */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 right-0 w-64 h-full opacity-10"
                            style={{
                                backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)',
                                backgroundSize: '14px 14px',
                            }}
                        />
                    </div>

                    {/* 中国风: 祥云红绸背景 */}
                    <div className="absolute inset-x-0 bottom-0 h-24 opacity-[0.25] pointer-events-none transition-opacity duration-500 group-hover:opacity-[0.35]"
                        style={{
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'40\' viewBox=\'0 0 100 40\'%3E%3Cpath d=\'M50 20 C20 40, 20 0, 50 20 C80 40, 80 0, 50 20 Z\' fill=\'none\' stroke=\'%23FF3333\' stroke-width=\'1\'/%3E%3C/svg%3E")',
                            backgroundSize: '100px 40px',
                            backgroundRepeat: 'repeat-x',
                            backgroundPosition: 'bottom'
                        }}
                    />

                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 gap-4">
                        {/* 左侧：Logo + 校名 */}
                        <div className="flex items-center gap-4 z-10">
                            <div className="relative h-14 w-14 flex-shrink-0 bg-white rounded-2xl p-1.5 shadow-[0_2px_15px_rgba(230,0,0,0.15)] overflow-hidden ring-2 ring-[#e60000]/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/thfls-logo.png"
                                    alt="广州市天河外国语学校"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-white/70 tracking-widest uppercase flex items-center gap-1.5">
                                    Guangzhou Tianhe Foreign Language School
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ff3b30] shadow-[0_0_6px_#ff3b30] animate-pulse"></span>
                                </p>
                                <h1 className="text-lg font-bold text-white leading-tight tracking-tight mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
                                    广州市天河外国语学校
                                </h1>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Sparkles className="h-3 w-3 text-[#ff3333]" />
                                    <span className="text-xs text-white/90 font-medium">
                                        AI 智能错题本 · 助力天外学子卓越成长
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 右侧：中国印章 & 校训徽章 */}
                        <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto z-10 w-full sm:w-auto justify-end">
                            {/* 中国特色：金石印章 */}
                            <div className="opacity-95 flex transform rotate-6 transition-transform hover:-rotate-3 duration-300">
                                <div className="border border-[#e60000] p-[2px] rounded-sm bg-[#e60000]/10 backdrop-blur-sm shadow-[0_0_12px_rgba(230,0,0,0.3)]">
                                    <div className="border-[1.5px] border-[#e60000] p-[1px] flex items-center justify-center w-10 h-10 bg-[#e60000]/5">
                                        <span className="text-[#ff3b30] text-[13px] font-bold font-serif leading-none tracking-[3px] flex items-center justify-center" style={{ writingMode: 'vertical-rl', textOrientation: 'upright', letterSpacing: '2px' }}>
                                            天外
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 校训徽章 */}
                            <div className="hidden sm:flex flex-col items-center gap-1 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl px-4 py-2 border border-[#ff3b30]/30 shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_0_8px_rgba(230,0,0,0.15)] transition-colors hover:border-[#ff3b30]/50">
                                <GraduationCap className="h-5 w-5 text-[#ff3b30] drop-shadow-[0_0_4px_rgba(255,59,48,0.5)]" />
                                <p className="text-[10px] text-white font-medium text-center leading-tight tracking-widest">
                                    智慧脑·世界眼
                                </p>
                                <p className="text-[9px] text-white/70 text-center leading-tight">
                                    未来英才
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Section */}
                <div className="flex justify-between items-start gap-4">
                    <UserWelcome />

                    <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm shrink-0">
                        <BroadcastNotification />
                        <SettingsDialog />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-muted-foreground hover:text-destructive"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            title={t.app?.logout || 'Logout'}
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* 励志标语展示 */}
                {currentSlogan && (
                    <div className="flex w-full justify-center py-2 apple-fade-in stagger-3">
                        <div className="relative group flex items-center gap-3 px-8 py-3 rounded-full bg-gradient-to-r from-[#e60000]/[0.02] via-[#e60000]/[0.08] to-[#e60000]/[0.02] border border-[#e60000]/10 overflow-hidden text-center transition-all duration-300 hover:border-[#e60000]/30 shadow-[0_2px_10px_rgba(230,0,0,0.02)] hover:shadow-[0_4px_15px_rgba(230,0,0,0.08)]">
                            <Sparkles className="w-4 h-4 text-[#e60000]/50" />
                            <p className="text-[14px] md:text-[15px] font-serif font-medium text-[#c8102e] dark:text-[#ff4d4d] tracking-[0.2em] relative z-10">
                                {currentSlogan}
                            </p>
                            <Sparkles className="w-4 h-4 text-[#e60000]/50" />
                        </div>
                    </div>
                )}

                {/* Action Center */}
                <div className={initialNotebookId ? "flex justify-center mb-6" : "grid grid-cols-2 md:grid-cols-4 gap-4"}>
                    <Button
                        size="lg"
                        className={`h-auto py-4 text-base shadow-sm hover:shadow-md transition-all border-0 ${initialNotebookId ? "w-full max-w-md" : ""} ${
                            step === "upload" 
                                ? "bg-gradient-to-br from-[#e60000] to-[#b30000] hover:from-[#ff1a1a] hover:to-[#cc0000] text-white shadow-[0_4px_14px_rgba(230,0,0,0.25)]" 
                                : ""
                        }`}
                        variant={step === "upload" ? "default" : "secondary"}
                        onClick={() => setStep("upload")}
                    >
                        <div className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            <span>{t.app.uploadNew}</span>
                        </div>
                    </Button>

                    {!initialNotebookId && (
                        <>
                            <Link href="/notebooks" className="w-full">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full h-auto py-4 text-base shadow-sm hover:shadow-md transition-all border hover:border-primary/50 hover:bg-accent/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" />
                                        <span>{t.app.viewNotebook}</span>
                                    </div>
                                </Button>
                            </Link>

                            <Link href="/tags" className="w-full">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full h-auto py-4 text-base shadow-sm hover:shadow-md transition-all border hover:border-primary/50 hover:bg-accent/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <Tags className="h-5 w-5" />
                                        <span>{t.app?.tags || 'Tags'}</span>
                                    </div>
                                </Button>
                            </Link>

                            <Link href="/stats" className="w-full">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full h-auto py-4 text-base shadow-sm hover:shadow-md transition-all border hover:border-primary/50 hover:bg-accent/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        <span>{t.app?.stats || 'Stats'}</span>
                                    </div>
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {step === "upload" && (
                    <UploadZone onImageSelect={onImageSelect} isAnalyzing={analysisStep !== 'idle'} />
                )}

                {step === "batch" && (
                    <BatchAnalyzer 
                        images={batchImages} 
                        notebookId={initialNotebookId || autoSelectedNotebookId || undefined} 
                        onCancel={() => setStep("upload")}
                        pendingItems={pendingItems}
                        setPendingItems={setPendingItems}
                        onReviewItem={(item) => {
                            setParsedData(item.question);
                            setCurrentImage(item.image);
                            setEditingBatchItemId(item.id);
                            setStep("review");
                        }}
                    />
                )}

                {croppingImage && (
                    <ImageCropper
                        imageSrc={croppingImage}
                        open={isCropperOpen}
                        onClose={() => setIsCropperOpen(false)}
                        onCropComplete={handleCropComplete}
                    />
                )}

                {step === "review" && parsedData && (
                    <CorrectionEditor
                        initialData={parsedData}
                        onSave={handleSave}
                        onCancel={() => {
                            if (editingBatchItemId) {
                                setEditingBatchItemId(null);
                                setStep("batch");
                            } else {
                                setStep("upload");
                            }
                        }}
                        imagePreview={currentImage}
                        initialSubjectId={initialNotebookId || autoSelectedNotebookId || undefined}
                        aiTimeout={aiTimeout}
                    />
                )}

            </div>
        </main>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HomeContent />
        </Suspense>
    );
}
