"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, ChevronDown } from "lucide-react";
import { Badge } from "./badge";

interface MultiSelectProps {
  label?: string;
  error?: string;
  options: readonly string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(
    (opt) =>
      !value.includes(opt) &&
      opt.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
    setSearch("");
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <div
        className={cn(
          "min-h-10 w-full rounded-md border bg-surface px-3 py-2 cursor-pointer",
          "transition-all duration-default",
          open ? "border-primary shadow-glow" : "border-border",
          error && "border-error"
        )}
        onClick={() => setOpen(true)}
      >
        <div className="flex flex-wrap gap-1.5 items-center">
          {value.map((v) => (
            <Badge key={v} variant="default" className="gap-1">
              {v}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(v);
                }}
                className="hover:text-white"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          {open ? (
            <input
              type="text"
              className="flex-1 min-w-[80px] bg-transparent text-text-primary text-sm outline-none placeholder:text-text-muted"
              placeholder={value.length === 0 ? placeholder : "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          ) : value.length === 0 ? (
            <span className="text-text-muted text-sm flex-1">{placeholder}</span>
          ) : null}
          <ChevronDown
            size={16}
            className={cn(
              "text-text-muted ml-auto transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </div>
      {open && filtered.length > 0 && (
        <div className="relative">
          <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-surface shadow-glow">
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-hover transition-colors"
                onClick={() => toggle(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
