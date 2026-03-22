"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { processImageFile } from "@/lib/image-utils";
import { apiClient } from "@/lib/api-client";
import { ParsedQuestion } from "@/lib/ai";
import { Loader2, ArrowLeft, CheckCircle2, Play, Image as ImageIcon } from "lucide-react";
import { frontendLogger } from "@/lib/frontend-logger";

export interface BatchItem {
    id: string;
    question: ParsedQuestion;
    image: string; // Base64 of the page image
}

interface BatchAnalyzerProps {
    images: File[];
    notebookId?: string;
    onCancel: () => void;
    onReviewItem: (item: BatchItem) => void;
    pendingItems: BatchItem[];
    setPendingItems: (items: BatchItem[] | ((prev: BatchItem[]) => BatchItem[])) => void;
}

export function BatchAnalyzer({ images, notebookId, onCancel, onReviewItem, pendingItems, setPendingItems }: BatchAnalyzerProps) {
    const { t, language } = useLanguage();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completedPages, setCompletedPages] = useState(0);

    const startAnalysis = async () => {
        setIsAnalyzing(true);
        setCompletedPages(0);
        setProgress(0);
        
        try {
            const results: BatchItem[] = [];
            for (let i = 0; i < images.length; i++) {
                const file = images[i];
                frontendLogger.info('[Batch]', `Analyzing page ${i + 1}/${images.length}`);
                
                const base64Image = await processImageFile(file);
                
                try {
                    const data = await apiClient.post<ParsedQuestion[]>("/api/analyze/batch", {
                        imageBase64: base64Image,
                        language: language,
                        subjectId: notebookId
                    }, { timeout: 300000 }); // Large timeout for batch

                    if (Array.isArray(data)) {
                        data.forEach((q, idx) => {
                            results.push({
                                id: `${Date.now()}-${i}-${idx}`,
                                question: q,
                                image: base64Image
                            });
                        });
                    }
                } catch (err) {
                    frontendLogger.error('[Batch]', `Error on page ${i + 1}`, { error: err });
                }

                setCompletedPages(i + 1);
                setProgress(Math.round(((i + 1) / images.length) * 100));
            }
            
            setPendingItems((prev) => [...prev, ...results]);
        } catch (error) {
            frontendLogger.error('[Batch]', 'Analysis failed completely', { error });
            alert("Batch analysis encountered an error.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6 apple-fade-in stagger-2">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onCancel} disabled={isAnalyzing}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-xl font-bold font-sans tracking-tight">批量解析 (Batch Analysis)</h2>
                    <p className="text-sm text-muted-foreground">共 {images.length} 页文档，已提取 {pendingItems.length} 道题目</p>
                </div>
            </div>

            {images.length > 0 && pendingItems.length === 0 && !isAnalyzing && (
                <Card className="shadow-sm border border-neutral-200/50">
                    <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-2">
                            <ImageIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <h3 className="font-semibold text-lg text-foreground">准备就绪</h3>
                        <p className="text-muted-foreground max-w-md">
                            我们从 PDF 中提取了 {images.length} 页图片。点击下方按钮开始自动识别和拆分题目。此过程可能需要几分钟时间，请耐心等待。
                        </p>
                        <Button onClick={startAnalysis} size="lg" className="mt-4 px-8 custom-btn-primary">
                            <Play className="h-4 w-4 mr-2" /> 开始自动提取
                        </Button>
                    </CardContent>
                </Card>
            )}

            {isAnalyzing && (
                <Card className="shadow-sm border border-neutral-200/50">
                    <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <div className="w-full max-w-md space-y-2">
                            <h3 className="font-medium text-foreground">正在处理... ({completedPages}/{images.length})</h3>
                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                <div 
                                    className="bg-primary h-full transition-all duration-300 rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">{progress}%</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {pendingItems.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground">已提取题目 ({pendingItems.length})</h3>
                        {images.length > 0 && !isAnalyzing && pendingItems.length > 0 && completedPages < images.length && (
                            <Button variant="outline" size="sm" onClick={startAnalysis}>
                                继续提取剩余页面
                            </Button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingItems.map((item, index) => (
                            <Card key={item.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                <div className="h-32 bg-secondary/50 relative overflow-hidden flex items-center justify-center border-b">
                                    <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm" style={{ backgroundImage: `url(${item.image})` }} />
                                    <p className="z-10 text-xl font-bold text-muted-foreground">题 {index + 1}</p>
                                </div>
                                <CardContent className="p-4 space-y-3">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-primary">{item.question.subject}</p>
                                        <p className="text-sm font-medium line-clamp-2 text-foreground break-words m-0">
                                            {item.question.questionText || "（无题目文本）"}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-xs text-muted-foreground flex items-center">
                                            <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> 提取成功
                                        </span>
                                        <Button size="sm" onClick={() => onReviewItem(item)}>
                                            编辑并保存
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
