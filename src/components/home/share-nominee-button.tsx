"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareNomineeButton({ nomineeId, nomineeName }: { nomineeId: string; nomineeName: string }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Construct the absolute URL for the nominee's profile/voting page
        const url = `${window.location.origin}/nominees/${nomineeId}`;

        try {
            // Use native share if available (mostly mobile)
            if (navigator.share) {
                await navigator.share({
                    title: `Vote for ${nomineeName}`,
                    text: `Support ${nomineeName} in the Content Creators Awards!`,
                    url: url,
                });
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(url);
                setCopied(true);
                toast.success("Nominee link copied to clipboard!");
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            // Ignore AbortError which occurs when user cancels native share
            if (!(err instanceof DOMException && err.name === 'AbortError')) {
                toast.error("Could not share link.");
            }
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full border-white/10 bg-white/5 p-0 hover:bg-amber-500/20 hover:text-amber-400 transition-all duration-300 active:scale-95"
            onClick={handleShare}
            title="Share nominee link"
        >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        </Button>
    );
}