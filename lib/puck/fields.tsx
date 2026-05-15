'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FieldLabel } from '@puckeditor/core';

// ─── Tailwind Color Palette ───────────────────────────────────────────────────

const TAILWIND_COLORS: Record<string, Record<string, string>> = {
  transparent: { transparent: 'transparent' },
  white: { white: '#ffffff' },
  black: { black: '#000000' },
  slate: { '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0', '300': '#cbd5e1', '400': '#94a3b8', '500': '#64748b', '600': '#475569', '700': '#334155', '800': '#1e293b', '900': '#0f172a', '950': '#020617' },
  gray: { '50': '#f9fafb', '100': '#f3f4f6', '200': '#e5e7eb', '300': '#d1d5db', '400': '#9ca3af', '500': '#6b7280', '600': '#4b5563', '700': '#374151', '800': '#1f2937', '900': '#111827', '950': '#030712' },
  zinc: { '50': '#fafafa', '100': '#f4f4f5', '200': '#e4e4e7', '300': '#d4d4d8', '400': '#a1a1aa', '500': '#71717a', '600': '#52525b', '700': '#3f3f46', '800': '#27272a', '900': '#18181b', '950': '#09090b' },
  neutral: { '50': '#fafafa', '100': '#f5f5f5', '200': '#e5e5e5', '300': '#d4d4d4', '400': '#a3a3a3', '500': '#737373', '600': '#525252', '700': '#404040', '800': '#262626', '900': '#171717', '950': '#0a0a0a' },
  stone: { '50': '#fafaf9', '100': '#f5f5f4', '200': '#e7e5e4', '300': '#d6d3d1', '400': '#a8a29e', '500': '#78716c', '600': '#57534e', '700': '#44403c', '800': '#292524', '900': '#1c1917', '950': '#0c0a09' },
  red: { '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5', '400': '#f87171', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c', '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a' },
  orange: { '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74', '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c', '800': '#9a3412', '900': '#7c2d12', '950': '#431407' },
  amber: { '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d', '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309', '800': '#92400e', '900': '#78350f', '950': '#451a03' },
  yellow: { '50': '#fefce8', '100': '#fef9c3', '200': '#fef08a', '300': '#fde047', '400': '#facc15', '500': '#eab308', '600': '#ca8a04', '700': '#a16207', '800': '#854d0e', '900': '#713f12', '950': '#422006' },
  lime: { '50': '#f7fee7', '100': '#ecfccb', '200': '#d9f99d', '300': '#bef264', '400': '#a3e635', '500': '#84cc16', '600': '#65a30d', '700': '#4d7c0f', '800': '#3f6212', '900': '#365314', '950': '#1a2e05' },
  green: { '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0', '300': '#86efac', '400': '#4ade80', '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534', '900': '#14532d', '950': '#052e16' },
  emerald: { '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7', '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857', '800': '#065f46', '900': '#064e3b', '950': '#022c22' },
  teal: { '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4', '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e', '800': '#115e59', '900': '#134e4a', '950': '#042f2e' },
  cyan: { '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc', '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490', '800': '#155e75', '900': '#164e63', '950': '#083344' },
  sky: { '50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd', '300': '#7dd3fc', '400': '#38bdf8', '500': '#0ea5e9', '600': '#0284c7', '700': '#0369a1', '800': '#075985', '900': '#0c4a6e', '950': '#082f49' },
  blue: { '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554' },
  indigo: { '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc', '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b' },
  violet: { '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95', '950': '#2e1065' },
  purple: { '50': '#faf5ff', '100': '#f3e8ff', '200': '#e9d5ff', '300': '#d8b4fe', '400': '#c084fc', '500': '#a855f7', '600': '#9333ea', '700': '#7e22ce', '800': '#6b21a8', '900': '#581c87', '950': '#3b0764' },
  fuchsia: { '50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe', '300': '#f0abfc', '400': '#e879f9', '500': '#d946ef', '600': '#c026d3', '700': '#a21caf', '800': '#86198f', '900': '#701a75', '950': '#4a044e' },
  pink: { '50': '#fdf2f8', '100': '#fce7f3', '200': '#fbcfe8', '300': '#f9a8d4', '400': '#f472b6', '500': '#ec4899', '600': '#db2777', '700': '#be185d', '800': '#9d174d', '900': '#831843', '950': '#500724' },
  rose: { '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af', '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c', '800': '#9f1239', '900': '#881337', '950': '#4c0519' },
};

const TAILWIND_COLOR_FAMILIES = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
const TAILWIND_SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

// ─── Google Fonts ─────────────────────────────────────────────────────────────

const GOOGLE_FONTS: Record<string, string[]> = {
  'Sans-serif': ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'Nunito', 'Work Sans', 'DM Sans', 'Plus Jakarta Sans', 'Outfit', 'Fira Sans', 'Source Sans Pro', 'Ubuntu', 'Noto Sans', 'Mulish', 'Quicksand', 'Josefin Sans', 'Barlow'],
  'Serif': ['Playfair Display', 'Merriweather', 'Lora', 'PT Serif', 'Libre Baskerville', 'Crimson Text', 'EB Garamond', 'Cormorant Garamond', 'Spectral', 'Bitter'],
  'Monospace': ['Fira Code', 'JetBrains Mono', 'Source Code Pro', 'IBM Plex Mono', 'Roboto Mono', 'Space Mono'],
  'Display': ['Oswald', 'Anton', 'Bebas Neue', 'Righteous', 'Pacifico', 'Lobster', 'Abril Fatface', 'Fredoka One'],
};

function loadGoogleFont(fontFamily: string) {
  if (typeof document === 'undefined') return;
  const id = `gfont-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

// ─── Shared UI Helpers ────────────────────────────────────────────────────────

const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200';
const selectCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 shadow-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 cursor-pointer';
const btnCls = (active: boolean) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${active ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`;
const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

// ─── 1. fileUploaderField ─────────────────────────────────────────────────────

export function fileUploaderField({
  label = 'File',
  accept = 'image/*',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon: _icon,
}: { label?: string; accept?: string; icon?: React.ReactNode } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
      const [dragging, setDragging] = useState(false);
      const [urlInput, setUrlInput] = useState('');
      const inputRef = useRef<HTMLInputElement>(null);

      const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => onChange(e.target?.result as string);
        reader.readAsDataURL(file);
      };

      return (
        <FieldLabel label={label}>
          <div className="space-y-2">
            <div
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all cursor-pointer ${dragging ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/50'}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {value ? (
                <img src={value} alt="preview" className="max-h-32 rounded-lg object-contain" />
              ) : (
                <div className="text-center">
                  <div className="text-2xl mb-1">📁</div>
                  <p className="text-xs text-gray-500">Drag & drop or click to upload</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                className={inputCls}
                placeholder="Or paste URL…"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { onChange(urlInput); setUrlInput(''); } }}
              />
              <button
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 transition"
                onClick={() => { if (urlInput) { onChange(urlInput); setUrlInput(''); } }}
              >Use</button>
            </div>
            {value && (
              <button className="text-xs text-red-500 hover:text-red-700 transition" onClick={() => onChange('')}>Remove</button>
            )}
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 2. iconRadioField ────────────────────────────────────────────────────────

export function iconRadioField({
  label = 'Option',
  options = [] as { value: string; icon: React.ReactNode; tooltip?: string; label?: string }[],
  multiple = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon: _icon,
}: { label?: string; options?: { value: string; icon: React.ReactNode; tooltip?: string; label?: string }[]; multiple?: boolean; icon?: React.ReactNode } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: string | string[]; onChange: (v: string | string[]) => void }) => {
      const selected = multiple ? (Array.isArray(value) ? value : []) : value;

      const toggle = (v: string) => {
        if (multiple) {
          const arr = Array.isArray(selected) ? selected : [];
          onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
        } else {
          onChange(v);
        }
      };

      const isActive = (v: string) => multiple ? (Array.isArray(selected) && selected.includes(v)) : selected === v;

      return (
        <FieldLabel label={label}>
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => (
              <div key={opt.value} className="relative group">
                <button
                  title={opt.tooltip ?? opt.label}
                  onClick={() => toggle(opt.value)}
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${isActive(opt.value) ? 'bg-violet-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {opt.icon}
                </button>
                {(opt.tooltip ?? opt.label) && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50">
                    <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">{opt.tooltip ?? opt.label}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 3. searchableSelectField ─────────────────────────────────────────────────

export function searchableSelectField({
  label = 'Select',
  options = [] as { value: string; label: string }[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon: _icon,
}: { label?: string; options?: { value: string; label: string }[]; icon?: React.ReactNode } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
      const [search, setSearch] = useState('');
      const [open, setOpen] = useState(false);
      const ref = useRef<HTMLDivElement>(null);

      const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
      const selected = options.find((o) => o.value === value);

      useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
      }, []);

      return (
        <FieldLabel label={label}>
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen(!open)}
              className={`${inputCls} flex items-center justify-between text-left`}
            >
              <span>{selected?.label ?? 'Select…'}</span>
              <span className="text-gray-400 ml-2">▾</span>
            </button>
            {open && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="p-2 border-b border-gray-100">
                  <input
                    autoFocus
                    className={inputCls}
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filtered.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                      className={`w-full text-left px-3 py-2 text-sm transition hover:bg-violet-50 ${opt.value === value ? 'text-violet-600 font-medium bg-violet-50' : 'text-gray-700'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No results</p>}
                </div>
              </div>
            )}
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 4. toggleButtonField ─────────────────────────────────────────────────────

export function toggleButtonField({
  label = 'Toggle',
  onLabel = 'On',
  offLabel = 'Off',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon: _icon,
}: { label?: string; onLabel?: string; offLabel?: string; icon?: React.ReactNode } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
      <FieldLabel label={label}>
        <button
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 ${value ? 'bg-violet-600' : 'bg-gray-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
          <span className="sr-only">{value ? onLabel : offLabel}</span>
        </button>
      </FieldLabel>
    ),
  };
}

// ─── 5. colorPickerField ─────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#ffffff' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Gray', value: '#6b7280' },
];

export function colorPickerField({
  label = 'Color',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon: _icon,
  presets,
}: {
  label?: string;
  icon?: React.ReactNode;
  presets?: string[];
} = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({
      value,
      onChange,
    }: {
      value: string;
      onChange: (v: string) => void;
    }) => {
      const colors = presets
        ? presets.map((color) => ({
          label: color,
          value: color,
        }))
        : COLOR_OPTIONS;

      const [hex, setHex] = useState(value || '#000000');
      const [search, setSearch] = useState('');
      const [open, setOpen] = useState(false);
      const ref = useRef<HTMLDivElement>(null);

      const selected = colors.find((c) => c.value === value);

      const filtered = colors.filter((c) =>
        `${c.label} ${c.value}`.toLowerCase().includes(search.toLowerCase())
      );

      useEffect(() => {
        setHex(value || '#000000');
      }, [value]);

      useEffect(() => {
        const handler = (e: MouseEvent) => {
          if (ref.current && !ref.current.contains(e.target as Node)) {
            setOpen(false);
          }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
      }, []);

      return (
        <FieldLabel label={label}>
          <div className="space-y-2">
            <div ref={ref} className="relative">
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`${inputCls} flex items-center justify-between text-left`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: value || hex }}
                  />
                  <span>{selected?.label ?? value ?? 'Select color…'}</span>
                </span>

                <span className="ml-2 text-gray-400">▾</span>
              </button>

              {open && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl">
                  <div className="border-b border-gray-100 p-2">
                    <input
                      autoFocus
                      className={inputCls}
                      placeholder="Search color…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto">
                    {filtered.map((color) => (
                      <button
                        type="button"
                        key={color.value}
                        onClick={() => {
                          setHex(color.value);
                          onChange(color.value);
                          setOpen(false);
                          setSearch('');
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-violet-50 ${color.value === value
                            ? 'bg-violet-50 font-medium text-violet-600'
                            : 'text-gray-700'
                          }`}
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.value }}
                        />
                        <span>{color.label}</span>
                        <span className="ml-auto text-xs text-gray-400">
                          {color.value}
                        </span>
                      </button>
                    ))}

                    {filtered.length === 0 && (
                      <p className="px-3 py-2 text-xs text-gray-400">
                        No results
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hex}
                onChange={(e) => {
                  setHex(e.target.value);
                  onChange(e.target.value);
                }}
                className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 p-0.5"
              />

              <input
                className={inputCls}
                value={hex}
                onChange={(e) => {
                  setHex(e.target.value);

                  if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                    onChange(e.target.value);
                  }
                }}
                placeholder="#000000"
                maxLength={7}
              />
            </div>
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 6. sliderField ──────────────────────────────────────────────────────────

export function sliderField({
  label = 'Value',
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon: _icon,
}: { label?: string; min?: number; max?: number; step?: number; unit?: string; icon?: React.ReactNode } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
      <FieldLabel label={label}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value ?? min}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 h-2 rounded-full accent-violet-600 cursor-pointer"
          />
          <span className="text-xs font-medium text-gray-700 min-w-12 text-right">{value ?? min}{unit}</span>
        </div>
      </FieldLabel>
    ),
  };
}

// ─── 7. tagsField ────────────────────────────────────────────────────────────

export function tagsField({ label = 'Tags' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => {
      const [input, setInput] = useState('');
      const tags = Array.isArray(value) ? value : [];

      const add = () => {
        const t = input.trim();
        if (t && !tags.includes(t)) { onChange([...tags, t]); }
        setInput('');
      };

      return (
        <FieldLabel label={label}>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                  {tag}
                  <button onClick={() => onChange(tags.filter((t) => t !== tag))} className="text-violet-400 hover:text-violet-700 transition">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                placeholder="Add tag…"
              />
              <button onClick={add} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 transition">Add</button>
            </div>
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 8. buttonGroupField ─────────────────────────────────────────────────────

export function buttonGroupField({
  label = 'Option',
  options = [] as { value: string; label: string; icon?: React.ReactNode }[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon: _icon,
}: { label?: string; options?: { value: string; label: string; icon?: React.ReactNode }[]; icon?: React.ReactNode } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
      <FieldLabel label={label}>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {options.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex flex-1 items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium transition-all ${value === opt.value ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} ${i > 0 ? 'border-l border-gray-200' : ''}`}
            >
              {opt.icon && <span>{opt.icon}</span>}
              {opt.label}
            </button>
          ))}
        </div>
      </FieldLabel>
    ),
  };
}

// ─── 9. spacingField ─────────────────────────────────────────────────────────

export function spacingField({ label = 'Spacing' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: { top?: number; right?: number; bottom?: number; left?: number }; onChange: (v: object) => void }) => {
      const v = value || {};
      const update = (side: string, val: number) => onChange({ ...v, [side]: val });

      return (
        <FieldLabel label={label}>
          <div className="grid grid-cols-2 gap-2">
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <div key={side}>
                <label className={labelCls}>{side.charAt(0).toUpperCase() + side.slice(1)}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    value={v[side] ?? 0}
                    onChange={(e) => update(side, Number(e.target.value))}
                    className={inputCls}
                  />
                  <span className="text-xs text-gray-400">px</span>
                </div>
              </div>
            ))}
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 10. typographyField ─────────────────────────────────────────────────────

export interface TypographyValue {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: string;
  textDecoration?: string;
}

export function typographyField({ label = 'Typography' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: TypographyValue; onChange: (v: TypographyValue) => void }) => {
      const v: TypographyValue = value || {};
      const update = (key: keyof TypographyValue, val: string | number) => onChange({ ...v, [key]: val });

      const [fontSearch, setFontSearch] = useState('');
      const [fontOpen, setFontOpen] = useState(false);
      const fontRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        if (v.fontFamily) loadGoogleFont(v.fontFamily);
      }, [v.fontFamily]);

      useEffect(() => {
        const handler = (e: MouseEvent) => { if (fontRef.current && !fontRef.current.contains(e.target as Node)) setFontOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
      }, []);

      const allFonts = Object.values(GOOGLE_FONTS).flat();
      const filteredFonts = fontSearch
        ? allFonts.filter((f) => f.toLowerCase().includes(fontSearch.toLowerCase()))
        : allFonts;

      const weights = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
      const transforms = ['none', 'uppercase', 'lowercase', 'capitalize'];
      const decorations = ['none', 'underline', 'line-through', 'overline'];

      return (
        <FieldLabel label={label}>
          <div className="space-y-3">
            {/* Font Family */}
            <div>
              <label className={labelCls}>Font Family</label>
              <div ref={fontRef} className="relative">
                <button
                  onClick={() => setFontOpen(!fontOpen)}
                  className={`${inputCls} flex items-center justify-between text-left`}
                  style={{ fontFamily: v.fontFamily }}
                >
                  <span>{v.fontFamily || 'Select font…'}</span>
                  <span className="text-gray-400 ml-2">▾</span>
                </button>
                {fontOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl">
                    <div className="p-2 border-b border-gray-100">
                      <input autoFocus className={inputCls} placeholder="Search fonts…" value={fontSearch} onChange={(e) => setFontSearch(e.target.value)} />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {fontSearch ? (
                        filteredFonts.map((font) => (
                          <button
                            key={font}
                            onClick={() => { loadGoogleFont(font); update('fontFamily', font); setFontOpen(false); setFontSearch(''); }}
                            className={`w-full text-left px-3 py-2 text-sm transition hover:bg-violet-50 ${v.fontFamily === font ? 'text-violet-600 font-medium bg-violet-50' : 'text-gray-700'}`}
                            style={{ fontFamily: font }}
                          >
                            {font}
                          </button>
                        ))
                      ) : (
                        Object.entries(GOOGLE_FONTS).map(([category, fonts]) => (
                          <div key={category}>
                            <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50 sticky top-0">{category}</div>
                            {fonts.map((font) => (
                              <button
                                key={font}
                                onClick={() => { loadGoogleFont(font); update('fontFamily', font); setFontOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm transition hover:bg-violet-50 ${v.fontFamily === font ? 'text-violet-600 font-medium bg-violet-50' : 'text-gray-700'}`}
                                style={{ fontFamily: font }}
                              >
                                {font}
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className={labelCls}>Font Size: {v.fontSize ?? 16}px</label>
              <input type="range" min={8} max={120} step={1} value={v.fontSize ?? 16} onChange={(e) => update('fontSize', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
            </div>

            {/* Font Weight */}
            <div>
              <label className={labelCls}>Font Weight</label>
              <div className="flex flex-wrap gap-1">
                {weights.map((w) => (
                  <button key={w} onClick={() => update('fontWeight', w)} className={btnCls(v.fontWeight === w)}>{w}</button>
                ))}
              </div>
            </div>

            {/* Line Height & Letter Spacing */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Line Height: {v.lineHeight ?? 1.5}</label>
                <input type="range" min={0.8} max={3} step={0.1} value={v.lineHeight ?? 1.5} onChange={(e) => update('lineHeight', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
              </div>
              <div>
                <label className={labelCls}>Letter Spacing: {v.letterSpacing ?? 0}px</label>
                <input type="range" min={-5} max={20} step={0.5} value={v.letterSpacing ?? 0} onChange={(e) => update('letterSpacing', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
              </div>
            </div>

            {/* Text Transform */}
            <div>
              <label className={labelCls}>Text Transform</label>
              <div className="flex gap-1">
                {transforms.map((t) => (
                  <button key={t} onClick={() => update('textTransform', t)} className={btnCls(v.textTransform === t)}>{t === 'none' ? 'Aa' : t === 'uppercase' ? 'AA' : t === 'lowercase' ? 'aa' : 'Aa'}</button>
                ))}
              </div>
            </div>

            {/* Text Decoration */}
            <div>
              <label className={labelCls}>Text Decoration</label>
              <div className="flex gap-1">
                {decorations.map((d) => (
                  <button key={d} onClick={() => update('textDecoration', d)} className={btnCls(v.textDecoration === d)} style={{ textDecoration: d !== 'none' ? d : undefined }}>{d === 'none' ? 'None' : d}</button>
                ))}
              </div>
            </div>
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 11. tailwindColorField ───────────────────────────────────────────────────

export function tailwindColorField({ label = 'Color' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
      const [search, setSearch] = useState('');
      const [hexInput, setHexInput] = useState(value || '');

      useEffect(() => { setHexInput(value || ''); }, [value]);

      // Build flat searchable list: [{name: 'violet-500', hex: '#8b5cf6'}, ...]
      const allColors = [
        { name: 'transparent', hex: 'transparent' },
        { name: 'white', hex: '#ffffff' },
        { name: 'black', hex: '#000000' },
        ...TAILWIND_COLOR_FAMILIES.flatMap((family) =>
          TAILWIND_SHADES.map((shade) => ({
            name: `${family}-${shade}`,
            hex: TAILWIND_COLORS[family]?.[shade] ?? '',
          })).filter((c) => c.hex)
        ),
      ];

      const query = search.toLowerCase().trim();
      const isSearching = query.length > 0;
      const filtered = isSearching
        ? allColors.filter((c) => c.name.includes(query) || c.hex.includes(query))
        : allColors;

      // Group filtered results by family for non-search view
      const grouped = !isSearching
        ? TAILWIND_COLOR_FAMILIES.map((family) => ({
            family,
            colors: TAILWIND_SHADES.map((shade) => ({
              name: `${family}-${shade}`,
              hex: TAILWIND_COLORS[family]?.[shade] ?? '',
            })).filter((c) => c.hex),
          }))
        : [];

      return (
        <FieldLabel label={label}>
          <div className="space-y-2">
            {/* Search + hex input row */}
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search color (e.g. violet-500)"
                  className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
              </div>
              {/* Native color picker */}
              <input
                type="color"
                value={value && value !== 'transparent' ? value : '#ffffff'}
                onChange={(e) => { onChange(e.target.value); setHexInput(e.target.value); }}
                className="w-9 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0"
                title="Custom color"
              />
            </div>

            {/* Hex input */}
            <input
              type="text"
              value={hexInput}
              onChange={(e) => {
                setHexInput(e.target.value);
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value) || e.target.value === 'transparent') {
                  onChange(e.target.value);
                }
              }}
              placeholder="#7c3aed or transparent"
              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
            />

            {/* Search results */}
            {isSearching ? (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-sm">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-400">No colors found</p>
                ) : (
                  <div className="p-2 flex flex-wrap gap-1.5">
                    {filtered.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => { onChange(c.hex); setHexInput(c.hex); setSearch(''); }}
                        title={`${c.name} — ${c.hex}`}
                        className={`group relative w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 hover:z-10 ${value === c.hex ? 'border-violet-500 scale-110' : 'border-transparent hover:border-gray-300'}`}
                        style={{ backgroundColor: c.hex === 'transparent' ? undefined : c.hex, backgroundImage: c.hex === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)' : undefined, backgroundSize: '8px 8px', backgroundPosition: '0 0, 4px 4px' }}
                      >
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-50">
                          {c.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Grouped palette */
              <div className="space-y-0.5 max-h-64 overflow-y-auto pr-0.5">
                {/* Special colors row */}
                <div className="flex items-center gap-1 py-0.5">
                  <span className="text-[10px] text-gray-400 w-16 shrink-0">special</span>
                  <div className="flex gap-0.5">
                    {[
                      { name: 'transparent', hex: 'transparent' },
                      { name: 'white', hex: '#ffffff' },
                      { name: 'black', hex: '#000000' },
                    ].map((c) => (
                      <button
                        key={c.name}
                        onClick={() => { onChange(c.hex); setHexInput(c.hex); }}
                        title={c.name}
                        className={`w-5 h-5 rounded border-2 transition-all hover:scale-125 hover:z-10 relative ${value === c.hex ? 'border-violet-500 scale-110' : 'border-gray-200'}`}
                        style={{
                          backgroundColor: c.hex === 'transparent' ? undefined : c.hex,
                          backgroundImage: c.hex === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)' : undefined,
                          backgroundSize: '6px 6px',
                          backgroundPosition: '0 0, 3px 3px',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Color families */}
                {grouped.map(({ family, colors }) => (
                  <div key={family} className="flex items-center gap-1 py-0.5">
                    <span className="text-[10px] text-gray-400 w-16 shrink-0 capitalize">{family}</span>
                    <div className="flex gap-0.5">
                      {colors.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => { onChange(c.hex); setHexInput(c.hex); }}
                          title={`${c.name} — ${c.hex}`}
                          className={`w-5 h-5 rounded transition-all hover:scale-125 hover:z-10 relative ${value === c.hex ? 'ring-2 ring-violet-500 ring-offset-1 scale-110' : ''}`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Current value */}
            {value && (
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <div
                  className="w-5 h-5 rounded border border-gray-200 shrink-0"
                  style={{ backgroundColor: value !== 'transparent' ? value : undefined }}
                />
                <span className="text-[11px] text-gray-500 font-mono">{value}</span>
              </div>
            )}
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 12. backgroundField ─────────────────────────────────────────────────────

export interface BackgroundValue {
  type?: 'none' | 'color' | 'gradient' | 'image' | 'video';
  color?: string;
  gradientDirection?: string;
  gradientFrom?: string;
  gradientTo?: string;
  imageUrl?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;
  backgroundAttachment?: string;
}

export function backgroundField({ label = 'Background' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: BackgroundValue; onChange: (v: BackgroundValue) => void }) => {
      const v: BackgroundValue = value || { type: 'none' };
      const update = (key: keyof BackgroundValue, val: string) => onChange({ ...v, [key]: val });

      const bgTypes = ['none', 'color', 'gradient', 'image', 'video'] as const;
      const directions = ['to right', 'to left', 'to bottom', 'to top', 'to bottom right', 'to bottom left', 'to top right', 'to top left'];
      const sizes = ['cover', 'contain', 'auto'];
      const positions = ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'];
      const repeats = ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'];
      const attachments = ['scroll', 'fixed', 'local'];

      return (
        <FieldLabel label={label}>
          <div className="space-y-3">
            {/* Type selector */}
            <div>
              <label className={labelCls}>Type</label>
              <div className="flex gap-1 flex-wrap">
                {bgTypes.map((t) => (
                  <button key={t} onClick={() => update('type', t)} className={btnCls(v.type === t)}>{t}</button>
                ))}
              </div>
            </div>

            {/* Color */}
            {v.type === 'color' && (
              <div>
                <label className={labelCls}>Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={v.color || '#ffffff'} onChange={(e) => update('color', e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input className={inputCls} value={v.color || ''} onChange={(e) => update('color', e.target.value)} placeholder="#ffffff" />
                </div>
              </div>
            )}

            {/* Gradient */}
            {v.type === 'gradient' && (
              <div className="space-y-2">
                <div>
                  <label className={labelCls}>Direction</label>
                  <select className={selectCls} value={v.gradientDirection || 'to right'} onChange={(e) => update('gradientDirection', e.target.value)}>
                    {directions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>From</label>
                    <input type="color" value={v.gradientFrom || '#8b5cf6'} onChange={(e) => update('gradientFrom', e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  </div>
                  <div>
                    <label className={labelCls}>To</label>
                    <input type="color" value={v.gradientTo || '#ec4899'} onChange={(e) => update('gradientTo', e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  </div>
                </div>
                <div className="h-8 rounded-lg" style={{ background: `linear-gradient(${v.gradientDirection || 'to right'}, ${v.gradientFrom || '#8b5cf6'}, ${v.gradientTo || '#ec4899'})` }} />
              </div>
            )}

            {/* Image / Video URL */}
            {(v.type === 'image' || v.type === 'video') && (
              <div>
                <label className={labelCls}>URL</label>
                <input className={inputCls} value={v.imageUrl || ''} onChange={(e) => update('imageUrl', e.target.value)} placeholder="https://…" />
              </div>
            )}

            {/* Image options */}
            {v.type === 'image' && (
              <div className="space-y-2">
                <div>
                  <label className={labelCls}>Size</label>
                  <div className="flex gap-1">{sizes.map((s) => <button key={s} onClick={() => update('backgroundSize', s)} className={btnCls(v.backgroundSize === s)}>{s}</button>)}</div>
                </div>
                <div>
                  <label className={labelCls}>Position</label>
                  <select className={selectCls} value={v.backgroundPosition || 'center'} onChange={(e) => update('backgroundPosition', e.target.value)}>
                    {positions.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Repeat</label>
                  <div className="flex gap-1 flex-wrap">{repeats.map((r) => <button key={r} onClick={() => update('backgroundRepeat', r)} className={btnCls(v.backgroundRepeat === r)}>{r}</button>)}</div>
                </div>
                <div>
                  <label className={labelCls}>Attachment</label>
                  <div className="flex gap-1">{attachments.map((a) => <button key={a} onClick={() => update('backgroundAttachment', a)} className={btnCls(v.backgroundAttachment === a)}>{a}</button>)}</div>
                </div>
              </div>
            )}
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 13. overlayField ────────────────────────────────────────────────────────

export interface OverlayValue {
  enabled?: boolean;
  color?: string;
  opacity?: number;
  blendMode?: string;
}

export function overlayField({ label = 'Overlay' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: OverlayValue; onChange: (v: OverlayValue) => void }) => {
      const v: OverlayValue = value || { enabled: false, color: '#000000', opacity: 50, blendMode: 'normal' };
      const update = (key: keyof OverlayValue, val: string | number | boolean) => onChange({ ...v, [key]: val });

      const blendModes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'];

      return (
        <FieldLabel label={label}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Enable Overlay</span>
              <button
                onClick={() => update('enabled', !v.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${v.enabled ? 'bg-violet-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${v.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {v.enabled && (
              <>
                <div>
                  <label className={labelCls}>Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={v.color || '#000000'} onChange={(e) => update('color', e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                    <input className={inputCls} value={v.color || ''} onChange={(e) => update('color', e.target.value)} placeholder="#000000" />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Opacity: {v.opacity ?? 50}%</label>
                  <input type="range" min={0} max={100} step={1} value={v.opacity ?? 50} onChange={(e) => update('opacity', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
                </div>

                <div>
                  <label className={labelCls}>Blend Mode</label>
                  <select className={selectCls} value={v.blendMode || 'normal'} onChange={(e) => update('blendMode', e.target.value)}>
                    {blendModes.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="h-8 rounded-lg border border-gray-200" style={{ backgroundColor: v.color, opacity: (v.opacity ?? 50) / 100, mixBlendMode: v.blendMode as React.CSSProperties['mixBlendMode'] }} />
              </>
            )}
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 14. borderField ─────────────────────────────────────────────────────────

export interface BorderValue {
  style?: string;
  width?: number;
  color?: string;
  radiusTL?: number;
  radiusTR?: number;
  radiusBR?: number;
  radiusBL?: number;
  uniformRadius?: boolean;
  radius?: number;
  outline?: boolean;
}

export function borderField({ label = 'Border' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: BorderValue; onChange: (v: BorderValue) => void }) => {
      const v: BorderValue = value || { style: 'none', width: 1, color: '#000000', uniformRadius: true, radius: 0, outline: false };
      const update = (key: keyof BorderValue, val: string | number | boolean) => onChange({ ...v, [key]: val });

      const styles = ['none', 'solid', 'dashed', 'dotted', 'double'];

      return (
        <FieldLabel label={label}>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Style</label>
              <div className="flex gap-1 flex-wrap">
                {styles.map((s) => (
                  <button key={s} onClick={() => update('style', s)} className={btnCls(v.style === s)}>{s}</button>
                ))}
              </div>
            </div>

            {v.style !== 'none' && (
              <>
                <div>
                  <label className={labelCls}>Width: {v.width ?? 1}px</label>
                  <input type="range" min={0} max={20} step={1} value={v.width ?? 1} onChange={(e) => update('width', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
                </div>

                <div>
                  <label className={labelCls}>Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={v.color || '#000000'} onChange={(e) => update('color', e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                    <input className={inputCls} value={v.color || ''} onChange={(e) => update('color', e.target.value)} placeholder="#000000" />
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls}>Border Radius</label>
                <button onClick={() => update('uniformRadius', !v.uniformRadius)} className="text-xs text-violet-600 hover:text-violet-800 transition">
                  {v.uniformRadius ? 'Individual' : 'Uniform'}
                </button>
              </div>
              {v.uniformRadius ? (
                <div>
                  <label className={labelCls}>All corners: {v.radius ?? 0}px</label>
                  <input type="range" min={0} max={100} step={1} value={v.radius ?? 0} onChange={(e) => update('radius', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {(['TL', 'TR', 'BR', 'BL'] as const).map((corner) => {
                    const key = `radius${corner}` as keyof BorderValue;
                    return (
                      <div key={corner}>
                        <label className={labelCls}>{corner}: {(v[key] as number) ?? 0}px</label>
                        <input type="range" min={0} max={100} step={1} value={(v[key] as number) ?? 0} onChange={(e) => update(key, Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Outline</span>
              <button
                onClick={() => update('outline', !v.outline)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${v.outline ? 'bg-violet-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${v.outline ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 15. flexboxField ────────────────────────────────────────────────────────

export interface FlexboxValue {
  display?: string;
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  alignContent?: string;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
}

export function flexboxField({ label = 'Flexbox' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: FlexboxValue; onChange: (v: FlexboxValue) => void }) => {
      const v: FlexboxValue = value || { display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'stretch', gap: 0 };
      const update = (key: keyof FlexboxValue, val: string | number) => onChange({ ...v, [key]: val });

      const displays = ['flex', 'inline-flex'];
      const directions = [
        { value: 'row', label: '→' },
        { value: 'row-reverse', label: '←' },
        { value: 'column', label: '↓' },
        { value: 'column-reverse', label: '↑' },
      ];
      const wraps = ['nowrap', 'wrap', 'wrap-reverse'];
      const justifyOptions = [
        { value: 'flex-start', label: '|←' },
        { value: 'flex-end', label: '→|' },
        { value: 'center', label: '|·|' },
        { value: 'space-between', label: '|·|·|' },
        { value: 'space-around', label: '·|·|·' },
        { value: 'space-evenly', label: '≡' },
      ];
      const alignOptions = [
        { value: 'flex-start', label: '⊤' },
        { value: 'flex-end', label: '⊥' },
        { value: 'center', label: '⊕' },
        { value: 'baseline', label: '—' },
        { value: 'stretch', label: '↕' },
      ];
      const alignContentOptions = ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'stretch'];

      return (
        <FieldLabel label={label}>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Display</label>
              <div className="flex gap-1">{displays.map((d) => <button key={d} onClick={() => update('display', d)} className={btnCls(v.display === d)}>{d}</button>)}</div>
            </div>

            <div>
              <label className={labelCls}>Direction</label>
              <div className="flex gap-1">{directions.map((d) => <button key={d.value} onClick={() => update('flexDirection', d.value)} className={btnCls(v.flexDirection === d.value)} title={d.value}>{d.label}</button>)}</div>
            </div>

            <div>
              <label className={labelCls}>Wrap</label>
              <div className="flex gap-1">{wraps.map((w) => <button key={w} onClick={() => update('flexWrap', w)} className={btnCls(v.flexWrap === w)}>{w}</button>)}</div>
            </div>

            <div>
              <label className={labelCls}>Justify Content</label>
              <div className="flex gap-1 flex-wrap">{justifyOptions.map((j) => <button key={j.value} onClick={() => update('justifyContent', j.value)} className={btnCls(v.justifyContent === j.value)} title={j.value}>{j.label}</button>)}</div>
            </div>

            <div>
              <label className={labelCls}>Align Items</label>
              <div className="flex gap-1">{alignOptions.map((a) => <button key={a.value} onClick={() => update('alignItems', a.value)} className={btnCls(v.alignItems === a.value)} title={a.value}>{a.label}</button>)}</div>
            </div>

            <div>
              <label className={labelCls}>Align Content</label>
              <div className="flex gap-1 flex-wrap">{alignContentOptions.map((a) => <button key={a} onClick={() => update('alignContent', a)} className={btnCls(v.alignContent === a)}>{a.replace('flex-', '')}</button>)}</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelCls}>Gap: {v.gap ?? 0}px</label>
                <input type="range" min={0} max={80} step={1} value={v.gap ?? 0} onChange={(e) => update('gap', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
              </div>
              <div>
                <label className={labelCls}>Row: {v.rowGap ?? 0}px</label>
                <input type="range" min={0} max={80} step={1} value={v.rowGap ?? 0} onChange={(e) => update('rowGap', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
              </div>
              <div>
                <label className={labelCls}>Col: {v.columnGap ?? 0}px</label>
                <input type="range" min={0} max={80} step={1} value={v.columnGap ?? 0} onChange={(e) => update('columnGap', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
              </div>
            </div>
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 16. gridField ───────────────────────────────────────────────────────────

export interface GridValue {
  columns?: number | string;
  rows?: string;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  justifyItems?: string;
  alignItems?: string;
  justifyContent?: string;
  alignContent?: string;
  autoFlow?: string;
  customColumns?: string;
  customRows?: string;
  useCustomColumns?: boolean;
  useCustomRows?: boolean;
}

export function gridField({ label = 'Grid' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: GridValue; onChange: (v: GridValue) => void }) => {
      const v: GridValue = value || { columns: 3, gap: 16, justifyItems: 'stretch', alignItems: 'stretch', autoFlow: 'row' };
      const update = (key: keyof GridValue, val: string | number | boolean) => onChange({ ...v, [key]: val });

      const itemAligns = ['start', 'end', 'center', 'stretch'];
      const contentAligns = ['start', 'end', 'center', 'stretch', 'space-between', 'space-around', 'space-evenly'];
      const autoFlows = ['row', 'column', 'dense', 'row dense', 'column dense'];

      return (
        <FieldLabel label={label}>
          <div className="space-y-3">
            {/* Columns */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls}>Columns</label>
                <button onClick={() => update('useCustomColumns', !v.useCustomColumns)} className="text-xs text-violet-600 hover:text-violet-800 transition">
                  {v.useCustomColumns ? 'Preset' : 'Custom'}
                </button>
              </div>
              {v.useCustomColumns ? (
                <input className={inputCls} value={v.customColumns || ''} onChange={(e) => update('customColumns', e.target.value)} placeholder="e.g. 1fr 2fr 1fr" />
              ) : (
                <div className="flex gap-1 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                    <button key={n} onClick={() => update('columns', n)} className={btnCls(v.columns === n)}>{n}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Rows */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls}>Rows</label>
                <button onClick={() => update('useCustomRows', !v.useCustomRows)} className="text-xs text-violet-600 hover:text-violet-800 transition">
                  {v.useCustomRows ? 'Auto' : 'Custom'}
                </button>
              </div>
              {v.useCustomRows && (
                <input className={inputCls} value={v.customRows || ''} onChange={(e) => update('customRows', e.target.value)} placeholder="e.g. auto 200px auto" />
              )}
            </div>

            {/* Gaps */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelCls}>Gap: {v.gap ?? 0}px</label>
                <input type="range" min={0} max={80} step={1} value={v.gap ?? 0} onChange={(e) => update('gap', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
              </div>
              <div>
                <label className={labelCls}>Row: {v.rowGap ?? 0}px</label>
                <input type="range" min={0} max={80} step={1} value={v.rowGap ?? 0} onChange={(e) => update('rowGap', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
              </div>
              <div>
                <label className={labelCls}>Col: {v.columnGap ?? 0}px</label>
                <input type="range" min={0} max={80} step={1} value={v.columnGap ?? 0} onChange={(e) => update('columnGap', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
              </div>
            </div>

            {/* Justify/Align Items */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Justify Items</label>
                <div className="flex gap-1 flex-wrap">{itemAligns.map((a) => <button key={a} onClick={() => update('justifyItems', a)} className={btnCls(v.justifyItems === a)}>{a}</button>)}</div>
              </div>
              <div>
                <label className={labelCls}>Align Items</label>
                <div className="flex gap-1 flex-wrap">{itemAligns.map((a) => <button key={a} onClick={() => update('alignItems', a)} className={btnCls(v.alignItems === a)}>{a}</button>)}</div>
              </div>
            </div>

            {/* Justify/Align Content */}
            <div>
              <label className={labelCls}>Justify Content</label>
              <div className="flex gap-1 flex-wrap">{contentAligns.map((a) => <button key={a} onClick={() => update('justifyContent', a)} className={btnCls(v.justifyContent === a)}>{a.replace('space-', 'sp-')}</button>)}</div>
            </div>
            <div>
              <label className={labelCls}>Align Content</label>
              <div className="flex gap-1 flex-wrap">{contentAligns.map((a) => <button key={a} onClick={() => update('alignContent', a)} className={btnCls(v.alignContent === a)}>{a.replace('space-', 'sp-')}</button>)}</div>
            </div>

            {/* Auto Flow */}
            <div>
              <label className={labelCls}>Auto Flow</label>
              <div className="flex gap-1 flex-wrap">{autoFlows.map((f) => <button key={f} onClick={() => update('autoFlow', f)} className={btnCls(v.autoFlow === f)}>{f}</button>)}</div>
            </div>
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 17. shadowField ─────────────────────────────────────────────────────────

export interface ShadowLayer {
  x?: number;
  y?: number;
  blur?: number;
  spread?: number;
  color?: string;
  inset?: boolean;
}

export interface ShadowValue {
  enabled?: boolean;
  preset?: string;
  shadows?: ShadowLayer[];
}

const SHADOW_PRESETS: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
};

export function shadowField({ label = 'Shadow' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: ShadowValue; onChange: (v: ShadowValue) => void }) => {
      const v: ShadowValue = value || { enabled: false, preset: 'md', shadows: [] };
      const update = (key: keyof ShadowValue, val: string | boolean | ShadowLayer[]) => onChange({ ...v, [key]: val });

      const shadows: ShadowLayer[] = v.shadows || [];

      const addShadow = () => update('shadows', [...shadows, { x: 0, y: 4, blur: 6, spread: 0, color: '#00000033', inset: false }]);
      const removeShadow = (i: number) => update('shadows', shadows.filter((_, idx) => idx !== i));
      const updateShadow = (i: number, key: keyof ShadowLayer, val: number | string | boolean) => {
        const updated = shadows.map((s, idx) => idx === i ? { ...s, [key]: val } : s);
        update('shadows', updated);
      };

      return (
        <FieldLabel label={label}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Enable Shadow</span>
              <button
                onClick={() => update('enabled', !v.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${v.enabled ? 'bg-violet-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${v.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {v.enabled && (
              <>
                {/* Presets */}
                <div>
                  <label className={labelCls}>Presets</label>
                  <div className="flex gap-1 flex-wrap">
                    {Object.keys(SHADOW_PRESETS).map((p) => (
                      <button key={p} onClick={() => update('preset', p)} className={btnCls(v.preset === p)}>{p}</button>
                    ))}
                  </div>
                </div>

                {/* Custom shadows */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls}>Custom Shadows</label>
                    <button onClick={addShadow} className="text-xs text-violet-600 hover:text-violet-800 transition font-medium">+ Add</button>
                  </div>
                  <div className="space-y-3">
                    {shadows.map((shadow, i) => (
                      <div key={i} className="rounded-xl border border-gray-200 p-3 space-y-2 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">Shadow {i + 1}</span>
                          <button onClick={() => removeShadow(i)} className="text-xs text-red-400 hover:text-red-600 transition">Remove</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(['x', 'y', 'blur', 'spread'] as const).map((prop) => (
                            <div key={prop}>
                              <label className={labelCls}>{prop.charAt(0).toUpperCase() + prop.slice(1)}: {shadow[prop] ?? 0}px</label>
                              <input type="range" min={prop === 'x' || prop === 'y' ? -50 : 0} max={50} step={1} value={shadow[prop] ?? 0} onChange={(e) => updateShadow(i, prop, Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={shadow.color?.slice(0, 7) || '#000000'} onChange={(e) => updateShadow(i, 'color', e.target.value)} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                          <input className={inputCls} value={shadow.color || ''} onChange={(e) => updateShadow(i, 'color', e.target.value)} placeholder="#000000" />
                          <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                            <input type="checkbox" checked={shadow.inset || false} onChange={(e) => updateShadow(i, 'inset', e.target.checked)} className="accent-violet-600" />
                            Inset
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 18. animationField ──────────────────────────────────────────────────────

export interface AnimationValue {
  type?: string;
  duration?: number;
  delay?: number;
  easing?: string;
  repeat?: string;
}

export function animationField({ label = 'Animation' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: AnimationValue; onChange: (v: AnimationValue) => void }) => {
      const v: AnimationValue = value || { type: 'none', duration: 300, delay: 0, easing: 'ease', repeat: 'once' };
      const update = (key: keyof AnimationValue, val: string | number) => onChange({ ...v, [key]: val });

      const types = ['none', 'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'zoom-in', 'zoom-out', 'bounce', 'pulse'];
      const easings = ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'spring'];
      const repeats = ['once', 'loop', 'hover'];

      return (
        <FieldLabel label={label}>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Animation Type</label>
              <div className="flex gap-1 flex-wrap">
                {types.map((t) => (
                  <button key={t} onClick={() => update('type', t)} className={btnCls(v.type === t)}>{t}</button>
                ))}
              </div>
            </div>

            {v.type !== 'none' && (
              <>
                <div>
                  <label className={labelCls}>Duration: {v.duration ?? 300}ms</label>
                  <input type="range" min={0} max={3000} step={50} value={v.duration ?? 300} onChange={(e) => update('duration', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
                </div>

                <div>
                  <label className={labelCls}>Delay: {v.delay ?? 0}ms</label>
                  <input type="range" min={0} max={2000} step={50} value={v.delay ?? 0} onChange={(e) => update('delay', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
                </div>

                <div>
                  <label className={labelCls}>Easing</label>
                  <div className="flex gap-1 flex-wrap">
                    {easings.map((e) => (
                      <button key={e} onClick={() => update('easing', e)} className={btnCls(v.easing === e)}>{e}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Repeat</label>
                  <div className="flex gap-1">
                    {repeats.map((r) => (
                      <button key={r} onClick={() => update('repeat', r)} className={btnCls(v.repeat === r)}>{r}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 19. sizeField ───────────────────────────────────────────────────────────

export interface SizeValue {
  width?: number | string;
  widthUnit?: string;
  height?: number | string;
  heightUnit?: string;
  minWidth?: number | string;
  minWidthUnit?: string;
  maxWidth?: number | string;
  maxWidthUnit?: string;
  minHeight?: number | string;
  minHeightUnit?: string;
  maxHeight?: number | string;
  maxHeightUnit?: string;
  aspectRatio?: string;
}

export function sizeField({ label = 'Size' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: SizeValue; onChange: (v: SizeValue) => void }) => {
      const v: SizeValue = value || {};
      const update = (key: keyof SizeValue, val: string | number) => onChange({ ...v, [key]: val });

      const units = ['px', '%', 'vw', 'vh', 'auto', 'full'];
      const aspectRatios = ['auto', '1/1', '4/3', '16/9', '3/2', '2/1', '9/16'];

      const SizePair = ({ label: pairLabel, valueKey, unitKey }: { label: string; valueKey: keyof SizeValue; unitKey: keyof SizeValue }) => {
        const unit = (v[unitKey] as string) || 'px';
        const val = v[valueKey];
        return (
          <div>
            <label className={labelCls}>{pairLabel}</label>
            <div className="flex gap-1">
              {unit !== 'auto' && unit !== 'full' && (
                <input
                  type="number"
                  min={0}
                  value={typeof val === 'number' ? val : ''}
                  onChange={(e) => update(valueKey, Number(e.target.value))}
                  className={`${inputCls} w-20`}
                  placeholder="0"
                />
              )}
              <select className={selectCls} value={unit} onChange={(e) => update(unitKey, e.target.value)}>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        );
      };

      return (
        <FieldLabel label={label}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <SizePair label="Width" valueKey="width" unitKey="widthUnit" />
              <SizePair label="Height" valueKey="height" unitKey="heightUnit" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SizePair label="Min Width" valueKey="minWidth" unitKey="minWidthUnit" />
              <SizePair label="Max Width" valueKey="maxWidth" unitKey="maxWidthUnit" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SizePair label="Min Height" valueKey="minHeight" unitKey="minHeightUnit" />
              <SizePair label="Max Height" valueKey="maxHeight" unitKey="maxHeightUnit" />
            </div>
            <div>
              <label className={labelCls}>Aspect Ratio</label>
              <div className="flex gap-1 flex-wrap">
                {aspectRatios.map((r) => (
                  <button key={r} onClick={() => update('aspectRatio', r)} className={btnCls(v.aspectRatio === r)}>{r}</button>
                ))}
              </div>
            </div>
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 20. positionField ───────────────────────────────────────────────────────

export interface PositionValue {
  position?: string;
  top?: number;
  topUnit?: string;
  right?: number;
  rightUnit?: string;
  bottom?: number;
  bottomUnit?: string;
  left?: number;
  leftUnit?: string;
  zIndex?: number;
  overflow?: string;
}

export function positionField({ label = 'Position' }: { label?: string } = {}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: PositionValue; onChange: (v: PositionValue) => void }) => {
      const v: PositionValue = value || { position: 'static', zIndex: 0, overflow: 'visible' };
      const update = (key: keyof PositionValue, val: string | number) => onChange({ ...v, [key]: val });

      const positions = ['static', 'relative', 'absolute', 'fixed', 'sticky'];
      const overflows = ['visible', 'hidden', 'scroll', 'auto'];
      const units = ['px', '%', 'vw', 'vh', 'rem', 'em'];

      const OffsetInput = ({ side }: { side: 'top' | 'right' | 'bottom' | 'left' }) => {
        const unitKey = `${side}Unit` as keyof PositionValue;
        const unit = (v[unitKey] as string) || 'px';
        return (
          <div>
            <label className={labelCls}>{side.charAt(0).toUpperCase() + side.slice(1)}</label>
            <div className="flex gap-1">
              <input
                type="number"
                value={typeof v[side] === 'number' ? v[side] : ''}
                onChange={(e) => update(side, Number(e.target.value))}
                className={`${inputCls} w-16`}
                placeholder="0"
              />
              <select className={selectCls} value={unit} onChange={(e) => update(unitKey, e.target.value)}>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        );
      };

      return (
        <FieldLabel label={label}>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Position</label>
              <div className="flex gap-1 flex-wrap">
                {positions.map((p) => (
                  <button key={p} onClick={() => update('position', p)} className={btnCls(v.position === p)}>{p}</button>
                ))}
              </div>
            </div>

            {v.position !== 'static' && (
              <div className="grid grid-cols-2 gap-2">
                <OffsetInput side="top" />
                <OffsetInput side="right" />
                <OffsetInput side="bottom" />
                <OffsetInput side="left" />
              </div>
            )}

            <div>
              <label className={labelCls}>Z-Index: {v.zIndex ?? 0}</label>
              <input type="range" min={-10} max={100} step={1} value={v.zIndex ?? 0} onChange={(e) => update('zIndex', Number(e.target.value))} className="w-full h-2 rounded-full accent-violet-600 cursor-pointer" />
            </div>

            <div>
              <label className={labelCls}>Overflow</label>
              <div className="flex gap-1">
                {overflows.map((o) => (
                  <button key={o} onClick={() => update('overflow', o)} className={btnCls(v.overflow === o)}>{o}</button>
                ))}
              </div>
            </div>
          </div>
        </FieldLabel>
      );
    },
  };
}

// ─── 11. asyncSearchableSelectField ──────────────────────────────────────────
//
// Like searchableSelectField but fetches options from a URL at render time.
// Used in the Puck editor sidebar to populate store-specific dropdowns
// (collections, categories, brands, tags) without hardcoding options.
//
// `fetchUrl` can be a string OR a function — the function form is evaluated
// lazily at render time so it can read getEditorStoreId() after the editor
// has mounted and called setEditorStoreId().
//
// Results must be { id, name }[]. An "All" option (value = "") is prepended.

export function asyncSearchableSelectField({
  label = 'Select',
  fetchUrl,
  placeholder = 'All',
  icon: _icon,
}: {
  label?: string;
  /** URL to GET, or a function returning the URL (evaluated at render time) */
  fetchUrl: string | (() => string);
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return {
    type: 'custom' as const,
    label,
    render: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
      const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
      const [loading, setLoading] = useState(true);
      const [search, setSearch] = useState('');
      const [open, setOpen] = useState(false);
      const ref = useRef<HTMLDivElement>(null);

      // Resolve URL lazily — function form reads getEditorStoreId() at render time
      const resolvedUrl = typeof fetchUrl === 'function' ? fetchUrl() : fetchUrl;

      // Fetch options once on mount (or when resolvedUrl changes)
      useEffect(() => {
        if (!resolvedUrl) { setLoading(false); return; }
        setLoading(true);
        fetch(resolvedUrl)
          .then((r) => r.ok ? r.json() : Promise.reject(r.status))
          .then((data: { id: string; name: string }[]) => {
            setOptions([
              { value: '', label: placeholder },
              ...data.map((d) => ({ value: d.id, label: d.name })),
            ]);
          })
          .catch(() => {
            setOptions([{ value: '', label: placeholder }]);
          })
          .finally(() => setLoading(false));
      }, [resolvedUrl]); // eslint-disable-line react-hooks/exhaustive-deps

      // Close on outside click
      useEffect(() => {
        const handler = (e: MouseEvent) => {
          if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
      }, []);

      const filtered = options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      );
      const selected = options.find((o) => o.value === value);

      return (
        <FieldLabel label={label}>
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen(!open)}
              disabled={loading}
              className={`${inputCls} flex items-center justify-between text-left ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className={selected?.value ? 'text-gray-800' : 'text-gray-400'}>
                {loading ? 'Loading…' : (selected?.label ?? placeholder)}
              </span>
              <span className="text-gray-400 ml-2">▾</span>
            </button>
            {open && !loading && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="p-2 border-b border-gray-100">
                  <input
                    autoFocus
                    className={inputCls}
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filtered.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                      className={`w-full text-left px-3 py-2 text-sm transition hover:bg-violet-50 ${opt.value === value ? 'text-violet-600 font-medium bg-violet-50' : 'text-gray-700'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="px-3 py-2 text-xs text-gray-400">No results</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </FieldLabel>
      );
    },
  };
}
