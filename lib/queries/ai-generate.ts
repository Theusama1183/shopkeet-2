"use client";

import { useMutation } from "@tanstack/react-query";
import { Data } from "@puckeditor/core";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AiPageType = "home" | "about" | "products" | "contact" | "custom";

export type AiModelKey =
  | "llama-3.2-1b-instruct"
  | "llama-3.1-8b-fp8-fast"
  | "qwen3-30b-a3b-fp8"
  | "llama-3.3-70b-fp8-fast"
  | "gemma-4-26b";

export interface AiGenerateInput {
  prompt: string;
  model: AiModelKey;
  pageType: AiPageType;
  storeName?: string;
}

export interface AiGenerateResult {
  data: Data;
  model: string;
  componentCount: number;
}

// ── API function ──────────────────────────────────────────────────────────────

async function generatePage(
  storeId: string,
  input: AiGenerateInput
): Promise<AiGenerateResult> {
  const res = await fetch(`/api/stores/${storeId}/ai-generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (!res.ok) {
    // Surface the server error message directly to the mutation's error state
    throw new Error(json.error ?? `Request failed with status ${res.status}`);
  }

  return json as AiGenerateResult;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useMutation hook for AI page generation via Cloudflare Workers AI.
 *
 * Usage:
 *   const { mutate, isPending, error, data } = useAiGeneratePage(storeId);
 *   mutate({ prompt, model, pageType });
 */
export function useAiGeneratePage(storeId: string) {
  return useMutation({
    mutationFn: (input: AiGenerateInput) => generatePage(storeId, input),
    // No cache invalidation needed — this generates new Puck data,
    // it doesn't modify any server-side resource directly.
  });
}
