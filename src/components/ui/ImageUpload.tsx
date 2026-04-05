'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  folder: string;
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  rounded?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ImageUpload({
  folder,
  value,
  onChange,
  label = 'Upload Image',
  className = '',
  rounded = false,
  size = 'md',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-full h-48',
  };

  const handleUpload = async (file: File) => {
    if (file.size > 100 * 1024) {
      toast.error(`File too large (${(file.size / 1024).toFixed(0)}KB). Max 100KB allowed.`);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images allowed.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Upload failed');
        return;
      }

      onChange(data.url);
      toast.success('Image uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className={className}>
      {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}
      <div
        className={`relative ${sizeClasses[size]} ${rounded ? 'rounded-full' : 'rounded-xl'} border-2 border-dashed ${
          dragOver ? 'border-btg-terracotta bg-btg-blush/20' : value ? 'border-transparent' : 'border-btg-sand'
        } overflow-hidden cursor-pointer transition-all hover:border-btg-terracotta group`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-xs font-medium">Change</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            {uploading ? (
              <div className="animate-spin w-6 h-6 border-2 border-btg-terracotta border-t-transparent rounded-full" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <p className="text-xs text-gray-500">Click or drag</p>
                <p className="text-[10px] text-gray-400">Max 100KB</p>
              </>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

interface MultiImageUploadProps {
  folder: string;
  values: string[];
  onChange: (urls: string[]) => void;
  coverImage?: string;
  onCoverSelect?: (url: string) => void;
  label?: string;
  maxImages?: number;
}

export function MultiImageUpload({
  folder,
  values,
  onChange,
  coverImage,
  onCoverSelect,
  label = 'Upload Images',
  maxImages = 10,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (file.size > 100 * 1024) {
      toast.error(`File too large (${(file.size / 1024).toFixed(0)}KB). Max 100KB allowed.`);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images allowed.');
      return;
    }
    if (values.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Upload failed');
        return;
      }

      const newUrls = [...values, data.url];
      onChange(newUrls);
      // Auto-set first image as cover if none selected
      if (onCoverSelect && !coverImage && newUrls.length === 1) {
        onCoverSelect(data.url);
      }
      toast.success('Image uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const removed = values[index];
    const newUrls = values.filter((_, i) => i !== index);
    onChange(newUrls);
    // If removed was cover, reset cover
    if (onCoverSelect && removed === coverImage) {
      onCoverSelect(newUrls[0] || '');
    }
  };

  return (
    <div>
      {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}
      <div className="flex flex-wrap gap-3">
        {values.map((url, i) => (
          <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-gray-100 group">
            <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
            {onCoverSelect && (
              <button
                type="button"
                onClick={() => onCoverSelect(url)}
                className={`absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  coverImage === url
                    ? 'bg-btg-terracotta text-white'
                    : 'bg-white/80 text-gray-600 opacity-0 group-hover:opacity-100'
                } transition-opacity`}
              >
                {coverImage === url ? '★ Cover' : 'Set Cover'}
              </button>
            )}
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {values.length < maxImages && (
          <div
            onClick={() => inputRef.current?.click()}
            className="w-28 h-28 rounded-xl border-2 border-dashed border-btg-sand hover:border-btg-terracotta cursor-pointer flex flex-col items-center justify-center transition-colors"
          >
            {uploading ? (
              <div className="animate-spin w-5 h-5 border-2 border-btg-terracotta border-t-transparent rounded-full" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <p className="text-[10px] text-gray-400">Max 100KB</p>
              </>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {values.length}/{maxImages} images · JPEG, PNG, WebP · Max 100KB each
        {onCoverSelect && ' · Click "Set Cover" to select cover photo'}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
