import React from 'react';
import { TumorMetadata } from '../lib/types';

interface StatsTableProps {
  metadata: TumorMetadata[];
}

export function StatsTable({ metadata }: StatsTableProps) {
  if (!metadata || metadata.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted border border-border rounded-lg bg-surface/30">
        <p>No statistics available.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#1e1e2e] bg-[#0a0a0f]/50">
      <table className="w-full text-sm text-left text-text">
        <thead className="text-[10px] text-[#64748b] uppercase tracking-widest bg-[#12121a] border-b border-[#1e1e2e]">
          <tr>
            <th scope="col" className="px-6 py-4 font-semibold">Idx</th>
            <th scope="col" className="px-6 py-4 font-semibold">Detection Confidence</th>
            <th scope="col" className="px-6 py-4 font-semibold">Area (px²)</th>
            <th scope="col" className="px-6 py-4 font-semibold">Width</th>
            <th scope="col" className="px-6 py-4 font-semibold">Height</th>
            <th scope="col" className="px-6 py-4 font-semibold text-right">BBox [x, y, w, h]</th>
          </tr>
        </thead>
        <tbody>
          {metadata.map((tumor, i) => (
            <tr key={i} className="border-b border-[#1e1e2e] last:border-0 hover:bg-[#12121a]/80 transition-colors">
              <td className="px-6 py-4 font-mono text-[11px] font-medium text-[#00ff88]">#{tumor.index}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#00ff88] shadow-[0_0_8px_#00ff88]" 
                      style={{ width: `${tumor.confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-[#64748b]">{(tumor.confidence * 100).toFixed(1)}%</span>
                </div>
              </td>
              <td className="px-6 py-4 font-mono text-[11px] text-[#e2e8f0]">{tumor.area_px.toLocaleString()}</td>
              <td className="px-6 py-4 font-mono text-[11px] text-[#e2e8f0]">{tumor.width_px}</td>
              <td className="px-6 py-4 font-mono text-[11px] text-[#e2e8f0]">{tumor.height_px}</td>
              <td className="px-6 py-4 font-mono text-[11px] text-[#64748b] text-right">
                [{tumor.bbox.map(n => n.toFixed(1)).join(', ')}]
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
