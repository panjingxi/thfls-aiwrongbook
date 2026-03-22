"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotebookCardProps {
    id: string;
    name: string;
    errorCount: number;
    onClick: () => void;
    onDelete?: (id: string) => void;
    itemLabel?: string;
}

export function NotebookCard({ id, name, errorCount, onClick, onDelete, itemLabel = "items" }: NotebookCardProps) {
    return (
        <Card
            className="cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200 relative group"
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0071e3]/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-[#0071e3]" />
                        </div>
                        <CardTitle className="text-lg">{name}</CardTitle>
                    </div>
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(id);
                            }}
                        >
                            <Trash2 className={`h-4 w-4 ${errorCount > 0 ? "text-[#86868b]" : "text-[#ff3b30]"}`} />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                        {errorCount} {itemLabel}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}
