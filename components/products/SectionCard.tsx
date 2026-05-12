"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
  badge?: string;
}

export function SectionCard({
  title,
  description,
  children,
  defaultOpen = true,
  collapsible = false,
  className,
  badge,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("bg-white rounded-xl border border-zinc-200 overflow-hidden", className)}>
      <div
        className={cn(
          "flex items-center justify-between px-5 py-4",
          collapsible && "cursor-pointer hover:bg-zinc-50 transition-colors select-none"
        )}
        onClick={collapsible ? () => setOpen((p) => !p) : undefined}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
            {badge && (
              <span className="text-[10px] font-medium bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
          )}
        </div>
        {collapsible && (
          <ChevronDown
            className={cn(
              "w-4 h-4 text-zinc-400 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        )}
      </div>
      {(!collapsible || open) && (
        <div className="px-5 pb-5 space-y-4 border-t border-zinc-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  counter?: { current: number; max: number };
}

export function Field({ label, hint, error, required, children, counter }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {counter && (
          <span className={cn(
            "text-[10px] tabular-nums",
            counter.current > counter.max * 0.9 ? "text-amber-500" : "text-zinc-400"
          )}>
            {counter.current}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {hint && !error && <p className="text-xs text-zinc-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className={cn(
      "flex items-center justify-between gap-4 cursor-pointer",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      <div>
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          checked ? "bg-violet-600" : "bg-zinc-200"
        )}
      >
        <span className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4.5" : "translate-x-0.5"
        )} />
      </button>
    </label>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
  suffix?: string;
}

export function Input({ prefix, suffix, className, ...props }: InputProps) {
  if (prefix || suffix) {
    return (
      <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent">
        {prefix && (
          <span className="px-3 py-2 text-sm text-zinc-400 bg-zinc-50 border-r border-zinc-200 shrink-0">
            {prefix}
          </span>
        )}
        <input
          className={cn("flex-1 px-3 py-2 text-sm focus:outline-none", className)}
          {...props}
        />
        {suffix && (
          <span className="px-3 py-2 text-sm text-zinc-400 bg-zinc-50 border-l border-zinc-200 shrink-0">
            {suffix}
          </span>
        )}
      </div>
    );
  }
  return (
    <input
      className={cn(
        "w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent",
        className
      )}
      {...props}
    />
  );
}

// ── Select ────────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ options, placeholder, className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white",
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── TagInput ──────────────────────────────────────────────────────────────────

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

export function TagInput({ value, onChange, placeholder = "Add tag...", suggestions = [] }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !value.includes(t)) {
      onChange([...value, t]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[38px] px-2.5 py-1.5 border border-zinc-200 rounded-lg focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-700 text-xs rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-zinc-400 hover:text-zinc-700"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] text-sm focus:outline-none bg-transparent"
        />
      </div>
      {input && filtered.length > 0 && (
        <div className="border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
          {filtered.slice(0, 5).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="w-full text-left px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
