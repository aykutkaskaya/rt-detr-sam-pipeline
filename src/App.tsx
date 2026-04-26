import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ImageUploader } from './components/ImageUploader';
import { ResultTabs } from './components/ResultTabs';
import { Activity, Terminal as TerminalIcon } from 'lucide-react';
import { ConsoleTerminal } from './components/ConsoleTerminal';
import { cn } from './lib/utils';
import { useAppStore } from './store/useAppStore';
import { applyWindowing } from './lib/api';
import { LoadingOverlay } from './components/LoadingOverlay';

export default function App() {
  const {
    file, isScanning, result, error, isConsoleOpen, health,
    fetchHealth, handleImageSelected, handleAnalyze, clearSetup, setIsConsoleOpen,
    activeSlice, windowCenter, windowWidth, setImagePreview
  } = useAppStore();

  const windowingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  useEffect(() => {
    if (!file || isScanning) return;

    if (windowingTimerRef.current) clearTimeout(windowingTimerRef.current);

    windowingTimerRef.current = setTimeout(async () => {
      try {
        const winRes = await applyWindowing({
          image: file,
          slice_index: activeSlice,
          window_center: windowCenter,
          window_width: windowWidth
        });

        if (winRes.base_url) {
          setImagePreview(winRes.base_url);
        }
      } catch (err) {
        console.error("Live windowing failed:", err);
      }
    }, 150);

    return () => {
      if (windowingTimerRef.current) clearTimeout(windowingTimerRef.current);
    };
  }, [windowCenter, windowWidth, activeSlice, file, isScanning, setImagePreview]);

  const isLoadingVisible = !health || health.models_loading || !!health.models_error;

  let loadingStatus: 'initializing' | 'loading_weights' | 'starting_cuda' | 'ready' | 'error' = 'initializing';
  if (health?.models_error) {
    loadingStatus = 'error';
  } else if (health?.models_loaded) {
    loadingStatus = 'ready';
  } else if (health?.models_loading) {
    loadingStatus = 'loading_weights';
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans">
      <LoadingOverlay
        isVisible={isLoadingVisible}
        status={loadingStatus}
        error={health?.models_error}
      />

      <header className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end border-b border-border pb-4 pt-6 px-6 shrink-0 bg-background z-10 relative">
        <div className="mb-4 sm:mb-0">
          <p className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#00d0ff] drop-shadow-[0_0_12px_rgba(0,255,136,0.5)]">
            RT-DETR+SAM PIPELINE
          </p>
          <p className="text-[10px] text-muted/50 mt-1.5 font-mono tracking-[0.3em] uppercase flex items-center gap-2">
            <span className="h-[1px] w-4 bg-muted/20" />
            <span className="lowercase italic font-serif tracking-normal text-muted/80">by</span>
            <a
              href="https://www.aykutkaskaya.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 font-bold hover:text-accent transition-all cursor-pointer"
            >
              AYKUT KAŞKAYA
            </a>
          </p>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-6 gap-6 relative">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-accent opacity-10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-32 h-32 rounded-full bg-blue-500 opacity-5 blur-[80px] pointer-events-none" />

        <div className="w-full md:w-80 flex-shrink-0 glass-panel rounded-xl flex flex-col overflow-hidden relative z-10">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto flex flex-col gap-6 relative z-10 hidden-scrollbar">
          <div className="w-full flex flex-col gap-6 min-h-full">
            <div className="flex flex-col lg:flex-row gap-4 shrink-0">
              <div className="w-full lg:w-1/3 glass-panel rounded-xl overflow-hidden aspect-square lg:aspect-auto lg:h-[180px]">
                <ImageUploader onImageSelected={handleImageSelected} disabled={isScanning} />
              </div>

              <div className="w-full lg:w-2/3 glass-panel rounded-xl p-5 flex flex-col justify-between gap-4 lg:h-[180px]">
                <div>
                  <h2 className="text-base font-medium mb-1">Execution Pipeline</h2>
                  <p className="text-xs text-muted mb-2">Upload an MRI scan and click run. The pipeline uses RT-DETR for detection and Meta SAM for segmentation.</p>

                  {error && (
                    <div className="mb-2 p-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      {error}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                  <button
                    onClick={() => handleAnalyze()}
                    disabled={!file || isScanning}
                    className={cn(
                      "flex-1 border disabled:opacity-50 px-4 py-2.5 rounded-lg font-semibold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 duration-300",
                      file && !isScanning && !result
                        ? "animate-run-glow text-accent"
                        : "bg-border hover:bg-[#2a2a3e] border-[#303045] text-accent hover:text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.05)] hover:shadow-[0_0_20px_rgba(0,255,136,0.1)]"
                    )}
                  >
                    {!isScanning ? (
                      <>
                        <Activity className="w-4 h-4" />
                        Run Analysis
                      </>
                    ) : (
                      <>
                        <svg className="animate-spin mr-2 h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearSetup}
                    disabled={!file || isScanning}
                    className="px-6 py-2.5 rounded-lg border border-border text-muted hover:text-text hover:bg-white/5 disabled:opacity-50 text-xs uppercase tracking-widest font-semibold transition-colors"
                  >
                    Clear Setup
                  </button>
                  <button
                    onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                    className="px-4 py-2.5 rounded-lg border border-border text-muted hover:text-accent hover:border-accent/50 bg-[#161622] transition-colors flex items-center justify-center"
                    title="Toggle System Console"
                  >
                    <TerminalIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className={cn("flex-1 flex flex-col gap-6 min-h-[500px]", isConsoleOpen ? "xl:flex-row" : "")}>
              <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col">
                <ResultTabs />
              </div>

              {isConsoleOpen && (
                <div className="w-full xl:w-[400px] glass-panel rounded-xl overflow-hidden flex flex-col shrink-0">
                  <ConsoleTerminal />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
