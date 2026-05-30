"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareNomineeProps {
    nomineeId: string;
    nomineeName: string;
    className?: string;
}

export function ShareNominee({ nomineeId, nomineeName, className }: ShareNomineeProps) {
    const [copied, setCopied] = useState(false);

    // This constructs the full URL. Ensure your public voting route matches this pattern.
    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/nominees/${nomineeId}`
        : "";

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Vote for ${nomineeName}`,
                    text: `I just voted for ${nomineeName} in the Content Creators Awards! Cast your vote here:`,
                    url: shareUrl,
                });
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        }
    };

    return (
        <button
            onClick={handleShare}
            className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-500/20",
                className
            )}
        >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            <span>{copied ? "Link Copied!" : "Share Nominee"}</span>
        </button>
    );
}