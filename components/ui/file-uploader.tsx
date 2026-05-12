"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Image, Video, File, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploaderProps {
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  onUpload?: (files: File[]) => Promise<string[]>;
  onUrlsChange?: (urls: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  value?: string[];
}

export function FileUploader({
  accept = "image/*,video/*",
  maxSize = 10,
  multiple = false,
  onUpload,
  onUrlsChange,
  placeholder = "Drop files here or click to upload",
  className = "",
  disabled = false,
  value = [],
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(type => {
      if (type === 'image/*') return file.type.startsWith('image/');
      if (type === 'video/*') return file.type.startsWith('video/');
      return file.type === type;
    });
    
    if (!isValidType) {
      return `File type not supported. Accepted: ${accept}`;
    }
    
    return null;
  };

  const processFiles = async (files: FileList) => {
    if (disabled) return;
    
    setError(null);
    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        setError(error);
        return;
      }
    }

    if (!multiple && fileArray.length > 1) {
      setError("Only one file is allowed");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (onUpload) {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        const urls = await onUpload(fileArray);
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        const newUrls = multiple ? [...uploadedUrls, ...urls] : urls;
        setUploadedUrls(newUrls);
        onUrlsChange?.(newUrls);
        
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } else {
        // Fallback: create object URLs for preview
        const urls = fileArray.map(file => URL.createObjectURL(file));
        const newUrls = multiple ? [...uploadedUrls, ...urls] : urls;
        setUploadedUrls(newUrls);
        onUrlsChange?.(newUrls);
        setIsUploading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, multiple, uploadedUrls]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const removeFile = (index: number) => {
    const newUrls = uploadedUrls.filter((_, i) => i !== index);
    setUploadedUrls(newUrls);
    onUrlsChange?.(newUrls);
  };

  const getFileIcon = (url: string) => {
    if (url.includes('video') || url.match(/\.(mp4|webm|ogg|mov|avi)$/i)) {
      return <Video className="w-6 h-6" />;
    }
    if (url.includes('image') || url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return <Image className="w-6 h-6" />;
    }
    return <File className="w-6 h-6" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
          isDragging
            ? "border-violet-500 bg-violet-50"
            : error
            ? "border-red-300 bg-red-50"
            : "border-zinc-300 hover:border-violet-400 hover:bg-violet-50/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 mx-auto bg-violet-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-violet-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">Uploading...</p>
                <div className="w-full bg-zinc-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1">{uploadProgress}%</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-3"
            >
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-900">Upload Error</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setError(null);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 underline mt-2"
                >
                  Try again
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-3"
            >
              <div className="w-16 h-16 mx-auto bg-zinc-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">{placeholder}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Max size: {maxSize}MB • {accept.replace(/\*/g, "all")}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Uploaded Files */}
      {uploadedUrls.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-zinc-900">
            Uploaded Files ({uploadedUrls.length})
          </h4>
          <div className="grid gap-3">
            {uploadedUrls.map((url, index) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-xl"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center">
                  {url.startsWith('blob:') || url.startsWith('data:') ? (
                    <img src={url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    getFileIcon(url)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {url.split('/').pop() || `File ${index + 1}`}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="w-6 h-6 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}