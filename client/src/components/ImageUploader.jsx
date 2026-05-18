import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { uploadProductImage } from '../api';
import { fallbackImg } from './fallbackImg';

// Stages the file locally and only uploads to Vercel Blob when commitUpload() is called.
// Parent triggers commitUpload() during submit, then receives the final URL via onUrl().
const ImageUploader = forwardRef(function ImageUploader(
  { value, onUrl, fallbackKey, shape = 'square', label = 'Photo' },
  ref,
) {
  const fileInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    onUrl?.('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  useImperativeHandle(ref, () => ({
    async commitUpload() {
      if (!pendingFile) return value || '';
      setUploading(true);
      try {
        const { image_url } = await uploadProductImage(pendingFile);
        onUrl?.(image_url);
        return image_url;
      } finally {
        setUploading(false);
      }
    },
    isUploading: () => uploading,
  }), [pendingFile, value, uploading, onUrl]);

  const displayImage = previewUrl || value;
  const inputId = `image-uploader-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const imgShape = shape === 'round' ? 'rounded-full' : 'rounded-2xl';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <img
          src={displayImage || fallbackImg(fallbackKey || '')}
          alt=""
          className={`w-40 h-40 ${imgShape} object-cover bg-cocoa-soft border border-cocoa/40`}
          onError={e => { e.target.src = fallbackImg(fallbackKey || ''); }}
        />
        {displayImage && (
          <button
            type="button"
            onClick={clearImage}
            aria-label="Remove image"
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border border-cocoa/40 shadow-sm text-espresso-soft hover:text-terracotta flex items-center justify-center text-base"
          >
            ×
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        id={inputId}
      />
      <label
        htmlFor={inputId}
        className="cursor-pointer bg-tabby/10 text-tabby px-4 py-2 rounded-xl text-sm font-bold hover:bg-tabby/20 transition-colors min-h-[44px] flex items-center gap-2"
      >
        <span>📷</span>
        <span>{displayImage ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}</span>
      </label>
      {uploading && <p className="text-xs text-cocoa">Uploading…</p>}
    </div>
  );
});

export default ImageUploader;
