"use client";

import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    nomineeId: string;
    currentImageUrl?: string | null;
    onUploadComplete?: (url: string) => void;
}

export function ImageUpload({ nomineeId, currentImageUrl, onUploadComplete }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Strict validation as requested: JPEG and PNG only
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            alert("Please upload a JPEG or PNG image.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("nomineeId", nomineeId);

        try {
            const res = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            setPreview(data.url);
            onUploadComplete?.(data.url);
        } catch (err) {
            console.error("Upload error:", err);
            alert(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={cn(
                    "relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 transition-all hover:bg-white/10",
                    uploading && "cursor-not-allowed opacity-50"
                )}
            >
                {preview ? (
                    <div className="relative h-full w-full">
                        <Image
                            src={preview}
                            alt="Preview"
                            fill
                            className="rounded-2xl object-cover"
                            unoptimized
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                            <p className="text-sm font-medium text-white">Change Image</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                        <div className="rounded-full bg-white/5 p-3">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-zinc-200">Click to upload photo</p>
                            <p className="text-xs">JPEG, PNG up to 5MB</p>
                        </div>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                )}
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleUpload}
            />
        </div>
    );
}