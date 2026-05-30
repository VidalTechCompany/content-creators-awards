"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SocialShareButtonsProps {
    nomineeId: string;
    nomineeName: string;
    nomineeUrl?: string;
}

export function SocialShareButtons({
    nomineeId,
    nomineeName,
    nomineeUrl,
}: SocialShareButtonsProps) {
    const [open, setOpen] = useState(false);
    const url = nomineeUrl || (typeof window !== 'undefined' ? `${window.location.origin}/nominees/${nomineeId}` : `https://example.com/nominees/${nomineeId}`);
    const title = `Vote for ${nomineeName}`;
    const description = `Support ${nomineeName} in the Content Creators Awards!`;

    const shareLinks = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} - ${description}`)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(url);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-white/10 bg-white/5 hover:bg-amber-500/20 hover:text-amber-400"
                >
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-white/10 bg-zinc-950">
                <DialogHeader>
                    <DialogTitle className="text-amber-50">Share {nomineeName}</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Share this nominee on your favorite platforms
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-4">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-white/10 bg-white/5 hover:bg-blue-500/20 hover:text-blue-400"
                        onClick={() => {
                            window.open(shareLinks.twitter, '_blank', 'width=550,height=420');
                        }}
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                        Twitter
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-white/10 bg-white/5 hover:bg-blue-600/20 hover:text-blue-300"
                        onClick={() => {
                            window.open(shareLinks.facebook, '_blank', 'width=600,height=400');
                        }}
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-white/10 bg-white/5 hover:bg-green-500/20 hover:text-green-400"
                        onClick={() => {
                            window.open(shareLinks.whatsapp, '_blank');
                        }}
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.47-.148-.67.15-.23.381-.921 1.226-1.129 1.474-.206.247-.412.277-.709.085-.297-.191-1.264-.823-2.41-1.487-1.13-.637-1.755-1.424-1.961-1.805-.207-.381-.021-.588.157-.758.162-.157.361-.41.542-.615.181-.204.271-.331.406-.551.134-.22.067-.414-.033-.611-.1-.297-.669-1.611-.916-2.206-.242-.579-.487-.501-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.99 1.523A9.9 9.9 0 006.51 5.031C3.91 7.631 2.25 11.306 2.25 15.238c0 1.113.213 2.21.632 3.261l-1.067 3.897 3.995-1.048a9.906 9.906 0 003.143.624h.003a9.905 9.905 0 009.904-9.904c0-2.652-.857-5.134-2.457-7.204a9.868 9.868 0 00-7.368-3.06M12 0C5.383 0 0 5.383 0 12c0 2.136.53 4.158 1.55 5.951L.006 23.498 5.25 22.065c1.734 1.019 3.754 1.547 5.75 1.547 6.617 0 12-5.383 12-12S18.617 0 12 0z" />
                        </svg>
                        WhatsApp
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-white/10 bg-white/5 hover:bg-sky-500/20 hover:text-sky-400"
                        onClick={() => {
                            window.open(shareLinks.telegram, '_blank');
                        }}
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a11.955 11.955 0 0 0-.064 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.05-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.487-1.302.487-.428 0-1.255-.241-1.865-.44-.752-.245-1.349-.338-1.297-.893.027-.467.199-1.518.443-2.592.321-1.346.922-3.455 1.385-5.128.44-1.595.773-2.692.773-2.692.005-.018.027-.018.032 0 .015.037 1.332 2.246 2.56 3.795 1.228 1.549 2.41 3.095 2.528 3.23.265.339.506.577.896.577.282 0 .599-.088 1.01-.26l.913-.303z" />
                        </svg>
                        Telegram
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-white/10 bg-white/5 hover:bg-blue-700/20 hover:text-blue-200"
                        onClick={() => {
                            window.open(shareLinks.linkedin, '_blank');
                        }}
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.05-8.736 0-9.643h3.554v1.364c.429-.659 1.191-1.599 2.896-1.599 2.117 0 3.705 1.384 3.705 4.362v5.516zM5.337 9.432c-1.144 0-1.915-.762-1.915-1.715 0-.953.77-1.715 1.968-1.715 1.197 0 1.914.762 1.939 1.715 0 .953-.742 1.715-1.992 1.715zm1.581 11.02H3.819V9.934h3.099v10.518zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 border-white/10 bg-white/5 hover:bg-amber-600/20 hover:text-amber-400"
                        onClick={handleCopyLink}
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                        </svg>
                        Copy Link
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
