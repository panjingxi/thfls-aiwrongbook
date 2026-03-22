"use client";

import { useState, useEffect } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function UserWelcome() {
    const { t, language } = useLanguage();
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const userName = mounted && session?.user ? (session.user.name || session.user.email) : 'User';

    return (
        <div className="flex items-center gap-3 bg-white dark:bg-[#1c1c1e] px-4 py-3 rounded-2xl shadow-[0_2px_12px_rgba(26,86,160,0.10)] apple-fade-in border border-[#1a56a0]/10 dark:border-[#4a90d9]/20">
            {/* 天外 Logo */}
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/thfls-logo.png"
                    alt="广州市天河外国语学校"
                    className="w-full h-full object-contain"
                />
            </div>
            {/* 分隔线 */}
            <div className="h-8 w-px bg-[#1a56a0]/15 dark:bg-[#4a90d9]/20" />
            {/* 用户信息 */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a56a0] to-[#4a90d9] flex items-center justify-center shadow-sm">
                    <User className="h-4 w-4 text-white" />
                </div>
                <div className="leading-tight">
                    <p className="text-[11px] text-[#86868b] dark:text-[#98989d] font-medium">
                        {t.common.welcome || '欢迎回来'}
                    </p>
                    <p className="text-sm font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {userName}
                    </p>
                </div>
            </div>
        </div>
    );
}
