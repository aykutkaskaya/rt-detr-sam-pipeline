import React from 'react';
import { cn } from '../lib/utils';
import { AlertCircle, CheckCircle2, Server, Cpu, Zap, Activity, Mail, Globe, Linkedin } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Sidebar() {
  const {
    computeDevice, setComputeDevice,
    confThreshold, setConfThreshold,
    detrWeightPath, setDetrWeightPath,
    samWeightPath, setSamWeightPath,
    totalSlices, activeSlice, setActiveSlice,
    windowCenter, setWindowCenter,
    windowWidth, setWindowWidth,
    result, health,
    isScanning,
    mode
  } = useAppStore();

  const isAnalyzed = result !== null;
  const metadata = result?.metadata;
  const systemInfo = {
    device: health?.device,
    executionTimeMs: result?.json_output?.system_status?.execution_time_ms,
    os: health?.system_info?.os,
    cpu: health?.system_info?.cpu,
    ram: health?.system_info?.ram_gb,
    gpu: health?.system_info?.gpu,
    vram: health?.system_info?.vram_gb
  };
  const disabled = isScanning;

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto hidden-scrollbar">
      <div className="px-6 py-6 bg-accent/5 border-b border-accent/20">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Author & Developer</span>
            <p className="text-lg font-black text-white tracking-tight leading-none">AYKUT KAŞKAYA</p>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href="mailto:aykut@kaskaya.com"
              className="flex items-center gap-2.5 text-[11px] text-white/70 hover:text-accent transition-colors group"
            >
              <div className="w-6 h-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-all">
                <Mail className="w-3.5 h-3.5 text-accent" />
              </div>
              aykut@kaskaya.com
            </a>

            <div className="flex gap-2">
              <a
                href="https://www.aykutkaskaya.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/80 hover:text-white hover:bg-white/10 transition-all font-bold uppercase tracking-widest"
              >
                <Globe className="w-3.5 h-3.5" /> Website
              </a>
              <a
                href="https://tr.linkedin.com/in/aykutkaskaya"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all font-bold uppercase tracking-widest"
              >
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-border bg-[#0a0a0f]/50">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">
          Pipeline Configuration
        </h3>

        <div className="flex flex-col gap-2">
          {systemInfo?.os && (
            <div className="flex flex-col bg-[#0d0d12] px-3 py-2 rounded border border-[#1e1e2e]">
              <span className="text-[9px] text-muted uppercase tracking-widest font-semibold mb-1">OS Environment</span>
              <span className="text-[10px] font-mono text-white/80 truncate" title={systemInfo.os}>{systemInfo.os}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col bg-[#0d0d12] px-3 py-2 rounded border border-[#1e1e2e]">
              <span className="text-[9px] text-muted uppercase tracking-widest font-semibold mb-1">CPU</span>
              <span className="text-[10px] font-mono text-white/80 truncate" title={systemInfo?.cpu}>{systemInfo?.cpu?.split(' ')[0] || 'Unknown'}</span>
            </div>
            <div className="flex flex-col bg-[#0d0d12] px-3 py-2 rounded border border-[#1e1e2e]">
              <span className="text-[9px] text-muted uppercase tracking-widest font-semibold mb-1">System RAM</span>
              <span className="text-[10px] font-mono text-white/80 truncate">{systemInfo?.ram || 'Unknown'}</span>
            </div>
          </div>

          <div className="bg-[#0d0d12] rounded-lg border border-[#1e1e2e] p-3 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-muted uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <Server className="w-3 h-3" /> Compute Engine
              </span>

              <div className="flex bg-[#12121a] rounded-md border border-[#1e1e2e] overflow-hidden p-0.5">
                <button
                  onClick={() => !disabled && setComputeDevice('auto')}
                  disabled={disabled}
                  className={cn("text-[9px] px-2 py-1 font-mono font-semibold uppercase transition-all rounded-sm flex items-center gap-1", computeDevice === 'auto' ? "bg-accent/20 text-accent" : "text-muted hover:text-white disabled:opacity-50")}
                >
                  Auto
                </button>
                <button
                  onClick={() => !disabled && setComputeDevice('cpu')}
                  disabled={disabled}
                  className={cn("text-[9px] px-2 py-1 font-mono font-semibold uppercase transition-all rounded-sm flex items-center gap-1", computeDevice === 'cpu' ? "bg-blue-500/20 text-blue-400" : "text-muted hover:text-white disabled:opacity-50")}
                >
                  <Cpu className="w-3 h-3" /> CPU
                </button>
                {systemInfo?.device === 'CUDA' && (
                  <button
                    onClick={() => !disabled && setComputeDevice('cuda')}
                    disabled={disabled}
                    className={cn("text-[9px] px-2 py-1 font-mono font-semibold uppercase transition-all rounded-sm flex items-center gap-1", computeDevice === 'cuda' ? "bg-[#00ff88]/20 text-[#00ff88]" : "text-muted hover:text-white disabled:opacity-50")}
                  >
                    <Zap className="w-3 h-3" /> GPU
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#12121a]/50 p-2.5 rounded border border-border/50">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono text-white/90 truncate whitespace-nowrap" title={computeDevice === 'cpu' || (computeDevice === 'auto' && systemInfo?.device !== 'CUDA') ? systemInfo?.cpu : systemInfo?.gpu}>
                  {computeDevice === 'cpu' || (computeDevice === 'auto' && systemInfo?.device !== 'CUDA')
                    ? systemInfo?.cpu
                    : (systemInfo?.gpu !== 'N/A' ? systemInfo?.gpu : 'Unknown GPU')}
                </p>
                <p className="text-[9px] text-muted font-mono mt-0.5 uppercase tracking-widest">Active Hardware</p>
              </div>
              {!(computeDevice === 'cpu' || (computeDevice === 'auto' && systemInfo?.device !== 'CUDA')) && systemInfo?.vram && systemInfo?.vram !== 'N/A' && (
                <div className="shrink-0 text-right border-l border-[#1e1e2e] pl-3">
                  <p className="text-[11px] font-mono text-accent whitespace-nowrap">{systemInfo?.vram}</p>
                  <p className="text-[9px] text-muted font-mono mt-0.5 uppercase tracking-widest">vRAM</p>
                </div>
              )}
            </div>
          </div>

          {systemInfo?.executionTimeMs !== undefined && (
            <div className="flex justify-between items-center bg-[#0d0d12] px-3 py-2 rounded border border-accent/20 mt-1">
              <span className="text-[10px] text-accent uppercase tracking-widest font-semibold">Last Latency</span>
              <span className="text-[10px] font-mono text-accent">
                {systemInfo.executionTimeMs} ms
              </span>
            </div>
          )}
        </div>
      </div>

      {totalSlices && totalSlices > 1 && activeSlice !== undefined && (
        <div className="px-6 py-4 border-b border-border bg-accent/5 flex flex-col gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-semibold text-accent uppercase tracking-widest">3D Volume Slice</label>
              <span className="text-xs font-mono text-white bg-accent/20 px-2 rounded">{activeSlice + 1} / {totalSlices}</span>
            </div>
            <input
              type="range"
              min={0} max={totalSlices - 1}
              value={activeSlice}
              onChange={(e) => setActiveSlice(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full accent-accent h-1.5 bg-border rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-semibold text-accent uppercase tracking-widest block">Windowing (HU)</label>
              {(windowCenter !== undefined || windowWidth !== undefined) && (
                <button
                  onClick={() => { setWindowCenter(undefined); setWindowWidth(undefined); }}
                  className="text-[9px] bg-accent/10 text-accent hover:bg-accent hover:text-[#0a0a0f] px-2 py-0.5 rounded font-mono uppercase tracking-widest transition-colors"
                >
                  Reset Auto
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-muted">Center (Brightness)</span>
                  <span className="text-[9px] font-mono text-white">{windowCenter ?? 'AUTO'}</span>
                </div>
                <input
                  type="range" min={-1000} max={1000} step={10}
                  value={windowCenter ?? 40} onChange={(e) => setWindowCenter(parseInt(e.target.value))} disabled={disabled}
                  className="w-full accent-accent h-1 bg-border rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-muted">Width (Contrast)</span>
                  <span className="text-[9px] font-mono text-white">{windowWidth ?? 'AUTO'}</span>
                </div>
                <input
                  type="range" min={1} max={3000} step={10}
                  value={windowWidth ?? 400} onChange={(e) => setWindowWidth(parseInt(e.target.value))} disabled={disabled}
                  className="w-full accent-accent h-1 bg-border rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6 flex-1">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-semibold text-muted uppercase tracking-widest">Confidence Threshold</label>
              <input
                type="number"
                disabled={disabled}
                min="0.01" max="1.00" step="0.01"
                value={confThreshold.toFixed(2)}
                onChange={(e) => setConfThreshold(Math.max(0.01, Math.min(1.0, parseFloat(e.target.value) || 0.01)))}
                className="w-16 bg-[#0d0d12] border border-[#1e1e2e] text-[11px] text-accent font-mono rounded px-2 py-0.5 outline-none focus:border-accent text-right transition-colors"
              />
            </div>
            <input
              disabled={disabled}
              type="range"
              min="0.01" max="1.0" step="0.01"
              value={confThreshold}
              onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
              className="w-full accent-accent h-1 bg-border rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="h-px bg-border/50 my-2" />

        <div className="space-y-4">
          <h3 className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-3">
            Local Weights Path
          </h3>

          <div>
            <label className="block text-[10px] text-muted mb-1 font-mono">detr_weights</label>
            <input
              disabled={disabled}
              type="text"
              value={detrWeightPath}
              onChange={(e) => setDetrWeightPath(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-border text-[11px] text-muted rounded px-2.5 py-2 font-mono outline-none focus:border-accent transition-colors"
              placeholder="./weights/rtdetr.pt"
            />
          </div>

          <div>
            <label className="block text-[10px] text-muted mb-1 font-mono">sam_weights</label>
            <input
              disabled={disabled}
              type="text"
              value={samWeightPath}
              onChange={(e) => setSamWeightPath(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-border text-[11px] text-muted rounded px-2.5 py-2 font-mono outline-none focus:border-accent transition-colors"
              placeholder="./weights/sam_vit_h.pth"
            />
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col shrink-0">
        {isAnalyzed && (
          <div className="border-t border-border bg-[#0a0a0f]">
            <div className="px-6 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">
                Diagnostic Report
              </h3>

              {metadata && metadata.length > 0 ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wide text-sm">Anomaly Detected</span>
                  </div>
                  <p className="text-xs text-red-400/80 leading-relaxed">
                    System identified <strong className="text-red-400">{metadata.length}</strong> potential anomalous region(s).
                    Please review the overlay for detailed segmentation and bounding boxes.
                  </p>
                </div>
              ) : mode === 'point' ? (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Activity className="w-5 h-5 animate-pulse" />
                    <span className="font-bold uppercase tracking-wide text-sm">Interactive Mode</span>
                  </div>
                  <p className="text-xs text-blue-400/80 leading-relaxed">
                    SAM manual segmentation is active. For automated tumor detection and an official diagnostic report, please use the <strong className="text-blue-400">"RUN ANALYSIS"</strong> control.
                  </p>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wide text-sm">No Anomalies</span>
                  </div>
                  <p className="text-xs text-green-400/80 leading-relaxed">
                    The analysis completed successfully. No significant tumors or anomalous regions were detected in this scan.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="px-6 py-4 bg-[#0a0a0f]/50 border-t border-border mt-auto">
          <div className="text-[10px] font-mono whitespace-pre-wrap text-muted opacity-40 leading-relaxed">
            {`<Pipeline id="RT-DETR+SAM">\n  status: ready\n</Pipeline>`}
          </div>
        </div>
      </div>
    </div>
  );
}
