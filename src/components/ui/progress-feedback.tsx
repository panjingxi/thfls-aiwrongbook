"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ProgressStatus = 'compressing' | 'uploading' | 'analyzing' | 'processing' | 'idle';

interface ProgressFeedbackProps {
    status: ProgressStatus;
    progress?: number;
    message?: string;
    className?: string;
}

import { useLanguage } from "@/contexts/LanguageContext";

export function ProgressFeedback({ status, progress, message, className }: ProgressFeedbackProps) {
    const { t } = useLanguage();
    // 确保只在客户端挂载完成后才渲染遮罩层，防止 SSR/Hydration 问题
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 只有在客户端挂载完成且 status 不为 idle 时才渲染
    if (!isMounted || status === 'idle') return null;

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-xl",
            className
        )}>
            <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] mx-4 apple-scale-in">
                <div className="flex flex-col items-center justify-center space-y-5 text-center">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
                        </div>
                    </div>

                    <div className="space-y-3 w-full">
                        <h3 className="text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                            {message}
                        </h3>
                        {progress !== undefined && (
                            <div className="w-full bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-full bg-[#0071e3] rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-[#86868b]">
                        {progress !== undefined ? `${Math.round(progress)}%` : (t.common.pleaseWait || 'Please wait...')}
                    </p>
                </div>
            </div>
        </div>
    );
}
