import React from 'react';
import { Download } from 'lucide-react';

interface MaskGridProps {
  maskUrls: string[];
}

export function MaskGrid({ maskUrls }: MaskGridProps) {
  if (!maskUrls || maskUrls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted border border-border rounded-lg bg-surface/30">
        <p>No isolated masks available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {maskUrls.map((url, i) => (
        <div key={i} className="group relative bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg overflow-hidden aspect-square flex items-center justify-center p-2 hover:border-[#00ff88]/50 hover:shadow-[0_0_20px_rgba(0,255,136,0.1)] transition-all">
          <img 
            src={url} 
            alt={`Segmentation Mask ${i + 1}`} 
            className="max-w-full max-h-full object-contain filter drop-shadow-lg opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#12121a]/80 border border-[#1e1e2e] backdrop-blur rounded text-[10px] font-mono text-[#00ff88]">
            #{i + 1}
          </div>
          <a 
            href={url}
            download={`mask_${i+1}.png`}
            className="absolute bottom-2 right-2 p-1.5 bg-[#12121a]/80 border border-[#1e1e2e] backdrop-blur rounded text-[#64748b] hover:text-[#00ff88] hover:border-[#00ff88]/50 opacity-0 group-hover:opacity-100 transition-all"
            title="Download Mask"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      ))}
    </div>
  );
}
