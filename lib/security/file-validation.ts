/**
 * File Upload Security Validation
 * Validates file types using magic bytes (file signatures)
 */

// Magic byte signatures for allowed file types
const FILE_SIGNATURES: Record<string, number[][]> = {
  // Images
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46, -1, -1, -1, -1, 0x57, 0x45, 0x42, 0x50], // RIFF....WEBP
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  'image/avif': [
    [-1, -1, -1, -1, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], // ftypavif
  ],
  
  // Videos
  'video/mp4': [
    [-1, -1, -1, -1, 0x66, 0x74, 0x79, 0x70], // ftyp
  ],
  'video/webm': [
    [0x1A, 0x45, 0xDF, 0xA3], // WebM (EBML)
  ],
};

/**
 * Validates file type using magic bytes
 * More secure than MIME type checking which can be spoofed
 */
export async function validateFileType(
  file: File,
  allowedTypes: Set<string>
): Promise<{ valid: boolean; detectedType?: string; error?: string }> {
  try {
    // Read first 12 bytes (enough for most signatures)
    const arrayBuffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Check against known signatures
    for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
      if (!allowedTypes.has(mimeType)) continue;
      
      for (const signature of signatures) {
        if (matchesSignature(bytes, signature)) {
          return { valid: true, detectedType: mimeType };
        }
      }
    }
    
    return {
      valid: false,
      error: `File type not allowed. Detected type does not match allowed types.`,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Checks if byte array matches a signature
 */
function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  
  for (let i = 0; i < signature.length; i++) {
    if (signature[i] === -1) continue;
    if (bytes[i] !== signature[i]) return false;
  }
  
  return true;
}

/**
 * Validates file size
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number
): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    };
  }
  
  return { valid: true };
}

/**
 * Sanitizes filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe characters
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
}
