import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { validateFileType, validateFileSize, sanitizeFilename } from "@/lib/security/file-validation";
import { inngest } from "@/lib/inngest/client";

// ── Cloudflare R2 client (S3-compatible) ──────────────────────────────────────
// R2 endpoint format: https://<account-id>.r2.cloudflarestorage.com
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // Required for R2 — disables virtual-hosted-style URLs
  forcePathStyle: true,
});

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
]);

const MAX_SIZE_MB = 50;

import { withCSRFProtection } from "@/lib/security/csrf";

export const POST = withCSRFProtection(async (req: NextRequest) => {
  try {
    // ── Env validation ──────────────────────────────────────────────────────
    const requiredEnv = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'] as const;
    for (const key of requiredEnv) {
      if (!process.env[key]) {
        console.error(`[upload] Missing required env var: ${key}`);
        return NextResponse.json({ error: "Upload service not configured" }, { status: 500 });
      }
    }

    // ── Auth ────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const folder = (formData.get("folder") as string) || "products";
    const storeId = formData.get("storeId") as string;

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // ── Authorization: verify user owns the store (if storeId provided) ─────
    if (storeId) {
      const { getDatabase } = await import("@/lib/supabase/database");
      const db = await getDatabase();

      const { data: store, error } = await db
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .eq('user_id', user.id)
        .single();

      if (error || !store) {
        return NextResponse.json(
          { error: "Store not found or access denied" },
          { status: 403 }
        );
      }
    }

    const results: {
      url: string;
      key: string;
      name: string;
      size: number;
      type: string;
    }[] = [];

    for (const file of files) {
      // ── Validate size ──────────────────────────────────────────────────────
      const sizeValidation = validateFileSize(file, MAX_SIZE_MB);
      if (!sizeValidation.valid) {
        return NextResponse.json(
          { error: sizeValidation.error },
          { status: 400 }
        );
      }

      // ── Validate type using magic bytes ────────────────────────────────────
      const typeValidation = await validateFileType(file, ALLOWED_TYPES);
      if (!typeValidation.valid) {
        return NextResponse.json(
          { error: typeValidation.error || `File type "${file.type}" is not allowed` },
          { status: 400 }
        );
      }

      // ── Build key with sanitized filename ──────────────────────────────────
      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/avif': 'avif',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
      };
      const ext = typeValidation.detectedType ? extMap[typeValidation.detectedType] : "bin";
      const sanitizedName = sanitizeFilename(file.name);
      const key = `${folder}/${user.id}/${nanoid(12)}.${ext}`;

      // ── Upload to R2 ───────────────────────────────────────────────────────
      const buffer = Buffer.from(await file.arrayBuffer());

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          Body: buffer,
          ContentType: typeValidation.detectedType || file.type,
          ContentLength: file.size,
          // Make uploaded files publicly readable
          // (requires R2 bucket to have public access enabled)
        })
      );

      // ── Build public URL ───────────────────────────────────────────────────
      const publicBase = process.env.R2_PUBLIC_URL!.replace(/\/$/, "");
      const url = `${publicBase}/${key}`;

      results.push({
        url,
        key,
        name: sanitizedName,
        size: file.size,
        type: typeValidation.detectedType || file.type,
      });

      // Trigger background job for image processing
      if (storeId && typeValidation.detectedType?.startsWith('image/')) {
        inngest.send({
          name: "image/uploaded",
          data: {
            url,
            storeId,
            type: typeValidation.detectedType,
            size: file.size,
          },
        }).catch((error) => {
          console.error("[inngest] Failed to send image/uploaded event:", error);
        });
      }
    }

    return NextResponse.json({ files: results });
  } catch (error) {
    console.error("[upload] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
});
