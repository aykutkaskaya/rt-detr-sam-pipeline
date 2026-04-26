import React, { useState } from 'react';
import { ScanOverlay } from './ScanOverlay';
import { MaskGrid } from './MaskGrid';
import { StatsTable } from './StatsTable';
import { Download, FileJson, Table, Grid, Image as ImageIcon, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

export function ResultTabs() {
  const {
    isScanning, imagePreview, result,
    mode, interactivePoints,
    isSegmenting
  } = useAppStore();

  const isAnalyzed = result !== null;
  const [activeTab, setActiveTab] = useState<'overlay' | 'masks' | 'stats' | 'json'>('overlay');

  const tabs = [
    { id: 'overlay', label: 'Overlay View', icon: ImageIcon },
    { id: 'masks', label: 'Isolated Masks', icon: Grid },
    { id: 'stats', label: 'Tumor Statistics', icon: Table },
    { id: 'json', label: 'Raw Output', icon: FileJson },
  ] as const;

  return (
    <div className="w-full flex flex-col h-full min-h-[500px]">
      <div className="flex items-center justify-between border-b border-[#1e1e2e] bg-[#12121a]/50 pr-4">
        <div className="flex overflow-x-auto hidden-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-[10px] tracking-widest uppercase font-semibold transition-all border-b-2 whitespace-nowrap",
                activeTab === tab.id
                  ? "border-[#00ff88] text-[#00ff88] bg-[#00ff88]/5"
                  : "border-transparent text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e1e2e]/30"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {result?.overlay_url && activeTab === 'overlay' && (
          <a
            href={result.overlay_url}
            download="overlay_result.png"
            className="flex items-center gap-2 px-4 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/30 hover:bg-[#00ff88]/20 text-[#00ff88] rounded-md text-[10px] tracking-widest font-bold uppercase transition-all shadow-sm"
          >
            <Download className="w-3 h-3" />
            Save Outcome
          </a>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-background/50">
        {activeTab === 'overlay' && (
          <div className="h-full flex flex-col gap-3">
            {mode === 'point' && !isScanning && (
              <div className="flex justify-center">
                <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono tracking-[0.15em] uppercase px-6 py-2 rounded-lg shadow-sm">
                  {(!interactivePoints || interactivePoints.length === 0)
                    ? "Interactive Mode: Click on image to define regions"
                    : "Multi-Region: Click to add • Click point to remove"}
                </div>
              </div>
            )}
            <div className="flex-1 min-h-[400px] scan-container-bg flex flex-col rounded-lg border border-[#1e1e2e] relative overflow-hidden">
              <ScanOverlay className="flex-1 h-full border-none bg-transparent opacity-90" />
            </div>
          </div>
        )}

        {activeTab === 'masks' && (
          <div className="h-full">
            {!result ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full animate-in fade-in duration-700">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Grid className="w-6 h-6 text-muted/40" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Isolated Segments</h3>
                <p className="text-xs text-muted max-w-[240px] leading-relaxed">
                  After detection, individual tumor masks will be extracted and displayed here for side-by-side comparison.
                </p>
              </div>
            ) : (
              <MaskGrid maskUrls={result.mask_urls} />
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="h-full">
            {!result ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full animate-in fade-in duration-700">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Table className="w-6 h-6 text-muted/40" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Quantitative Analytics</h3>
                <p className="text-xs text-muted max-w-[240px] leading-relaxed">
                  Metrics such as area (px²), confidence scores, and bounding box coordinates will be calculated upon execution.
                </p>
              </div>
            ) : result.metadata && result.metadata.length > 0 ? (
              <StatsTable metadata={result.metadata} />
            ) : mode === 'point' ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="p-4 bg-blue-500/5 rounded-full mb-4">
                  <Activity className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Interactive Mode Active</h3>
                <p className="text-xs text-blue-400/80 max-w-[280px] leading-relaxed">
                  SAM is currently performing <b>Manual Segmentation</b> only.
                </p>
                <p className="text-[10px] text-blue-400/60 mt-4 font-mono uppercase tracking-tighter">
                  To detect tumors automatically, please click <span className="text-blue-400 font-bold">"RUN ANALYSIS"</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-muted h-full">
                <p>No anomalies detected in the current slice.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'json' && (
          <div className="h-full">
            {!result ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full animate-in fade-in duration-700">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <FileJson className="w-6 h-6 text-muted/40" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Raw Metadata</h3>
                <p className="text-xs text-muted max-w-[240px] leading-relaxed">
                  Complete system output, including inference times and hardware utilization, will be available in JSON format.
                </p>
              </div>
            ) : (
              <div className="bg-[#0a0a0f] border border-border rounded-lg p-4 h-full overflow-auto text-xs font-mono">
                <pre className="text-text/80">
                  <code dangerouslySetInnerHTML={{
                    __html: syntaxHighlight(JSON.stringify(result.json_output, null, 2))
                  }} />
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function syntaxHighlight(json: string) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'text-[#64748b]';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'text-[#e2e8f0]';
      } else {
        cls = 'text-[#00ff88]';
      }
    } else if (/true|false/.test(match)) {
      cls = 'text-blue-400';
    } else if (/null/.test(match)) {
      cls = 'text-red-400';
    } else {
      cls = 'text-purple-400';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}
