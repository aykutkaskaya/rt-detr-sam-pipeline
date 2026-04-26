import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { API_BASE_URL } from '../lib/api';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImageSelected, disabled }: ImageUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onImageSelected(acceptedFiles[0]);
    }
  }, [onImageSelected]);

  // @ts-expect-error react-dropzone types incompatibility with React 19
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.dcm'],
      'application/octet-stream': ['.nii', '.nii.gz'],
      'application/gzip': ['.nii.gz']
    },
    maxFiles: 1,
    disabled: !!disabled
  });

  const loadDemo = async (filename: string, mimeType: string) => {
    try {
      const assetsUrl = API_BASE_URL.replace(/\/api$/, '/assets');
      const response = await fetch(`${assetsUrl}/${filename}`);
      if (!response.ok) throw new Error("Demo not found");
      const blob = await response.blob();
      const file = new File([blob], filename, { type: mimeType });
      onImageSelected(file);
    } catch (error) {
      console.error("Failed to load demo image", error);
      alert("Failed to load demo image. Ensure backend is running.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-2">
      <div
        {...getRootProps()}
        className={cn(
          "border border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-200 w-full flex-1 scan-container-bg",
          isDragActive ? "border-accent" : "border-[#1e1e2e] hover:border-[#00ff88]/50",
          isDragReject ? "border-red-500 bg-red-500/5" : "",
          disabled ? "opacity-50 cursor-not-allowed" : ""
        )}
      >
        <input {...getInputProps()} />
        <div className="w-10 h-10 rounded-full mb-3 bg-[#0a0a0f] border border-[#1e1e2e] flex items-center justify-center shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]">
          <Upload className={cn("w-4 h-4", isDragActive ? "text-accent" : "text-[#64748b]")} />
        </div>
        <h3 className="text-xs font-semibold text-text mb-1.5 uppercase tracking-widest">Load Scan Data</h3>
        <p className="text-[11px] text-[#64748b] max-w-[200px] leading-relaxed">
          {isDragActive
            ? "Drop the file here."
            : "Drag and drop or click to browse. (PNG, JPG, DICOM, NIfTI)"}
        </p>
      </div>

      <div className="flex gap-2 justify-center shrink-0 flex-wrap">
        <button
          onClick={(e) => { e.stopPropagation(); loadDemo('sample.jpg', 'image/jpeg'); }}
          className="text-[10px] bg-[#1e1e2e] hover:bg-[#2d2d3f] border border-[#2d2d3f] text-[#94a3b8] hover:text-[#00ff88] px-3 py-1.5 rounded transition-colors font-medium flex-1"
        >
          Demo 2D (JPG)
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); loadDemo('sample.dcm', 'application/dicom'); }}
          className="text-[10px] bg-[#1e1e2e] hover:bg-[#2d2d3f] border border-[#2d2d3f] text-[#94a3b8] hover:text-[#00ff88] px-3 py-1.5 rounded transition-colors font-medium flex-1"
        >
          Demo DICOM
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); loadDemo('sample.nii.gz', 'application/gzip'); }}
          className="text-[10px] bg-[#1e1e2e] hover:bg-[#2d2d3f] border border-[#2d2d3f] text-[#94a3b8] hover:text-[#00ff88] px-3 py-1.5 rounded transition-colors font-medium flex-1"
        >
          Demo 3D (NIfTI)
        </button>
      </div>
    </div>
  );
}
