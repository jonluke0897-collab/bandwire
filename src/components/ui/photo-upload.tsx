"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  className?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function PhotoUpload({
  value,
  onChange,
  max = 5,
  className,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = max - value.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);

    for (const file of toUpload) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_SIZE) continue;

      setUploading(true);
      try {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        // Construct the serving URL from the storage ID
        const servingUrl = `${process.env.NEXT_PUBLIC_CONVEX_URL!.replace(".cloud", ".site")}/api/storage/${storageId}`;
        onChange([...value, servingUrl]);
      } catch {
        // silently skip failed uploads
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-md overflow-hidden border border-border bg-surface">
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < max && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-surface hover:border-primary/50 hover:bg-surface-hover transition-colors cursor-pointer py-8"
        >
          {uploading ? (
            <Loader2 size={24} className="text-text-muted animate-spin" />
          ) : (
            <Upload size={24} className="text-text-muted" />
          )}
          <p className="text-sm text-text-muted">
            {uploading
              ? "Uploading..."
              : "Click or drag photos here"}
          </p>
          <p className="text-xs text-text-muted">
            JPG, PNG, WebP — max 5MB — {value.length}/{max}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}
    </div>
  );
}
