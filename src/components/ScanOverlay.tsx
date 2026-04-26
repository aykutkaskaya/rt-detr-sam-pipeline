import React, { useState, useRef } from 'react';
import { cn } from '../lib/utils';
import { Loader2, ZoomIn, SplitSquareHorizontal, Crosshair, BoxSelect, Database, X, Image as ImageIcon, Activity } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface ScanOverlayProps {
  className?: string;
}

export function ScanOverlay({ className }: ScanOverlayProps) {
  const {
    isScanning, imagePreview: imageSource, result,
    mode, setMode, isSegmenting,
    interactivePoints, handlePointClick, handlePointDelete, clearInteractivePoints
  } = useAppStore();

  const overlayImageSource = result?.overlay_url;
  const metadata = result?.metadata;
  const isAnalyzed = result !== null;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [showBoxes, setShowBoxes] = useState(true);
  const [showCrosshairs, setShowCrosshairs] = useState(true);

  const [sliderPos, setSliderPos] = useState(50);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [hoverBoxIndex, setHoverBoxIndex] = useState<number | null>(null);

  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      setImgNaturalSize({
        w: imageRef.current.naturalWidth,
        h: imageRef.current.naturalHeight
      });
    }
  }, [imageSource]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setMousePos({ x, y });

    if (mode === 'slider' && isDragging) {
      setSliderPos(x * 100);
    }

    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (isScanning) return;
    const zoomSpeed = 0.001;
    const delta = -e.deltaY;
    const newScale = Math.min(Math.max(scale + delta * zoomSpeed, 0.5), 10);
    setScale(newScale);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (mode === 'slider') {
      setIsDragging(true);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  const handleImageClick = (e: React.PointerEvent | React.MouseEvent) => {
    if (isPanning) return;
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      handlePointClick(x, y);
    }
  };

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const px = mousePos.x * 100;
  const py = mousePos.y * 100;

  return (
    <div
      ref={wrapperRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      className={cn("relative w-full h-full bg-[#050507] border border-border rounded-lg overflow-hidden flex items-center justify-center select-none", className)}
    >
      <div
        className="relative transition-transform duration-75 ease-out flex items-center justify-center"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'center'
        }}
      >
        {!imageSource ? (
          <div className="max-w-xl p-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-700 bg-accent/[0.02] rounded-3xl border border-white/5 shadow-2xl">
            <div className="w-20 h-20 rounded-[2.5rem] bg-accent/10 border border-accent/20 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(0,255,136,0.15)] animate-pulse">
              <Database className="w-10 h-10 text-accent" />
            </div>

            <h2 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">RT-DETR+SAM Pipeline</h2>
            <p className="text-sm text-muted leading-relaxed mb-10 max-w-md">
              The next generation of medical diagnostics. Powered by
              <span className="text-accent font-bold"> RT-DETR</span> and
              <span className="text-blue-400 font-bold"> Segment Anything</span>.
            </p>

            <div className="grid grid-cols-1 gap-5 w-full text-left">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-start hover:bg-white/[0.05] transition-all">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ImageIcon className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">1. DATA INGESTION</p>
                  <p className="text-[11px] text-muted/80 leading-normal font-medium">Upload MRI/CT scans (JPG, PNG) or volumetric data (DICOM, NIfTI).</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-start hover:bg-white/[0.05] transition-all">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">2. NEURAL INFERENCE</p>
                  <p className="text-[11px] text-muted/80 leading-normal font-medium">Click "RUN ANALYSIS" to deploy state-of-the-art models on your hardware.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-start hover:bg-white/[0.05] transition-all">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <SplitSquareHorizontal className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-widest mb-1">3. PRECISION REVIEW</p>
                  <p className="text-[11px] text-muted/80 leading-normal font-medium">Inspect pixel-perfect segmentations with advanced interactive tools.</p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-center gap-4 opacity-50">
              <div className="h-px w-12 bg-accent/30" />
              <p className="text-[10px] font-mono text-accent uppercase tracking-[0.5em] font-bold">System Online</p>
              <div className="h-px w-12 bg-accent/30" />
            </div>
          </div>
        ) : imageSource === 'MEDICAL_PLACEHOLDER' ? (
          <div className="text-muted flex flex-col items-center justify-center h-full w-full bg-surface/50 border border-dashed border-border/50 rounded-lg p-8">
            <Database className="w-12 h-12 mb-4 text-accent/40" />
            <p className="text-sm font-medium text-text">3D Medical Volume Loaded</p>
            <p className="text-xs text-muted mt-2 text-center max-w-[250px]">
              Browsers cannot render raw DICOM/NIfTI data natively. <br /><br />
              Click <strong>Run Analysis</strong> to process the volume and extract 2D slices.
            </p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <div
              className="relative flex items-center justify-center touch-none"
              style={{
                width: imgNaturalSize.w > 0 ? 'auto' : '100%',
                height: imgNaturalSize.h > 0 ? 'auto' : '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                aspectRatio: imgNaturalSize.h > 0 ? `${imgNaturalSize.w} / ${imgNaturalSize.h}` : 'auto'
              }}
              onPointerDown={(e) => {
                if (mode === 'slider') {
                  setIsDragging(true);
                  e.currentTarget.setPointerCapture(e.pointerId);
                } else if (mode === 'point') {
                  handleImageClick(e);
                }
              }}
              onPointerUp={(e) => {
                if (isDragging) {
                  setIsDragging(false);
                  e.currentTarget.releasePointerCapture(e.pointerId);
                }
              }}
              onPointerLeave={(e) => {
                if (e.buttons !== 1) {
                  setMousePos({ x: 0.5, y: 0.5 });
                }
              }}
            >
              <img
                ref={imageRef}
                src={imageSource}
                alt="MRI Scan"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                }}
                className={cn("max-w-full max-h-full object-contain rounded drop-shadow-md z-0", mode === 'point' ? "cursor-crosshair" : "")}
              />

              {showCrosshairs && !isScanning && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-20 z-0 overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(to right, #00ff88 1px, transparent 1px), linear-gradient(to bottom, #00ff88 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                  }}
                />
              )}

              {overlayImageSource && !isScanning && mode === 'slider' && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none z-10"
                  style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
                >
                  <img
                    src={overlayImageSource}
                    alt="Segmentation Overlay"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                </div>
              )}

              {overlayImageSource && !isScanning && mode === 'point' && (
                <img
                  src={overlayImageSource}
                  alt="Segmentation Overlay"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}

              {overlayImageSource && !isScanning && mode === 'slider' && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-accent z-30 shadow-[0_0_10px_rgba(0,255,136,0.8)] pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-8 bg-[#12121a] border border-accent rounded shadow-[0_0_15px_rgba(0,255,136,0.4)] flex items-center justify-center pointer-events-auto cursor-ew-resize">
                    <div className="flex gap-0.5">
                      <div className="w-0.5 h-4 bg-accent/50 rounded-full" />
                      <div className="w-0.5 h-4 bg-accent/50 rounded-full" />
                    </div>
                  </div>
                </div>
              )}

              {overlayImageSource && !isScanning && mode === 'magnifier' && (
                <>
                  <div
                    className="absolute inset-0 pointer-events-none z-30 overflow-hidden"
                    style={{ clipPath: `circle(90px at ${px}% ${py}%)` }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        transformOrigin: `${px}% ${py}%`,
                        transform: 'scale(2.5)'
                      }}
                    >
                      <img
                        src={imageSource}
                        alt="Magnified Base"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <img
                        src={overlayImageSource}
                        alt="Magnified Overlay"
                        className="absolute inset-0 w-full h-full object-cover drop-shadow-[0_0_15px_#00ff88]"
                      />
                    </div>
                  </div>
                  <div
                    className="absolute pointer-events-none border-2 border-accent rounded-full shadow-[0_0_30px_rgba(0,255,136,0.5)] z-40 bg-[#00ff88]/5 backdrop-blur-[1px]"
                    style={{ width: 180, height: 180, left: `${px}%`, top: `${py}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <div className="w-full h-[1px] bg-accent" />
                      <div className="absolute h-full w-[1px] bg-accent" />
                    </div>
                  </div>
                </>
              )}

              {metadata && metadata.length > 0 && showBoxes && !isScanning && imgNaturalSize.w > 0 && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-20"
                  viewBox={`0 0 ${imgNaturalSize.w} ${imgNaturalSize.h}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  {metadata.map((item, i) => {
                    const [x1, y1, x2, y2] = item.bbox;
                    const w = x2 - x1;
                    const h = y2 - y1;
                    const isHovered = hoverBoxIndex === i;

                    return (
                      <g key={i} className="pointer-events-auto"
                        onMouseEnter={() => setHoverBoxIndex(i)}
                        onMouseLeave={() => setHoverBoxIndex(null)}
                      >
                        <rect
                          x={x1} y={y1} width={w} height={h}
                          fill={isHovered ? "rgba(0,255,136,0.15)" : "transparent"}
                          stroke={isHovered ? "#00ff88" : "rgba(0,255,136,0.6)"}
                          strokeWidth={isHovered ? 4 / scale : 2 / scale}
                          strokeDasharray={isHovered ? "none" : `${8 / scale}, ${4 / scale}`}
                          className="transition-all duration-300 cursor-crosshair drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]"
                          rx={4 / scale}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              {(showCrosshairs || (mode === 'point' && (!interactivePoints || interactivePoints.length === 0))) && !isScanning && (
                <div className="absolute inset-0 pointer-events-none z-10 mix-blend-screen opacity-60">
                  <div className="absolute top-0 bottom-0 bg-accent/50 shadow-[0_0_10px_#00ff88]" style={{ left: `${px}%`, width: `${1 / scale}px` }} />
                  <div className="absolute left-0 right-0 bg-accent/50 shadow-[0_0_10px_#00ff88]" style={{ top: `${py}%`, height: `${1 / scale}px` }} />
                </div>
              )}

              {mode === 'point' && interactivePoints && interactivePoints.length > 0 && interactivePoints.map((point, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePointDelete(idx);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute z-[70] group cursor-pointer"
                  style={{
                    left: `${point.x * 100}%`,
                    top: `${point.y * 100}%`,
                    transform: `translate(-50%, -50%) scale(${1 / scale})`
                  }}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-[#00ff88] ring-2 ring-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-125">
                      <span className="text-[10px] font-bold text-black select-none">{idx + 1}</span>
                    </div>
                  </div>
                </div>
              ))}

              {isScanning && (
                <div className="absolute inset-0 overflow-hidden rounded pointer-events-none z-50 bg-[#00ff88]/5">
                  <div className="absolute left-0 right-0 h-[2px] bg-accent z-20 shadow-[0_0_15px_2px_#00ff88] animate-scan-slide" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-[#00ff88]/50 rounded-lg px-6 py-3 flex flex-col items-center gap-2 text-accent shadow-[0_0_30px_rgba(0,255,136,0.1)]">
                      <Loader2 className="w-6 h-6 animate-spin opacity-80" />
                      <div className="text-[10px] font-mono tracking-widest uppercase">Analyzing Sequence</div>
                    </div>
                  </div>
                </div>
              )}
              {isSegmenting && (
                <div className="absolute inset-0 overflow-hidden rounded pointer-events-none z-50 bg-blue-500/5">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-blue-500/50 rounded-lg px-6 py-3 flex flex-col items-center gap-2 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                      <Loader2 className="w-6 h-6 animate-spin opacity-80" />
                      <div className="text-[10px] font-mono tracking-widest uppercase italic">Processing Segmentation</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {imageSource && !isScanning && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-50 w-full max-w-[500px]">
          {mode === 'point' && !isAnalyzed && (
            <div className="flex items-center gap-2 bg-[#12121a]/95 backdrop-blur-md border border-accent/40 p-1.5 rounded-full shadow-lg">
              <div className="pl-3 pr-2 py-1 text-[10px] font-bold text-accent uppercase tracking-[0.1em] border-r border-white/10 mr-1 select-none">
                MULTI-REGION
              </div>
              <div className="flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20">
                {interactivePoints?.length || 0} SELECTIONS
              </div>
              <button
                onClick={clearInteractivePoints}
                className="flex items-center gap-1.5 px-4 py-1 rounded-full text-[10px] font-bold text-muted hover:text-red-400 transition-all"
              >
                <X className="w-3 h-3" /> RESET
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#12121a]/80 backdrop-blur-md border border-[#1e1e2e] p-2 rounded-xl shadow-2xl">
            <div className="flex bg-[#0a0a0f] rounded-lg p-1 border border-[#1e1e2e]">
              <button
                onClick={() => setMode('slider')}
                className={cn("p-2 rounded-md transition-all", mode === 'slider' ? "bg-accent/10 text-accent" : "text-muted hover:text-white")}
              >
                <SplitSquareHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMode('magnifier')}
                className={cn("p-2 rounded-md transition-all", mode === 'magnifier' ? "bg-accent/10 text-accent" : "text-muted hover:text-white")}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {!isAnalyzed && (
                <button
                  onClick={() => setMode('point')}
                  className={cn("p-2 rounded-md transition-all", mode === 'point' ? "bg-accent/10 text-accent" : "text-muted hover:text-white")}
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowBoxes(!showBoxes)}
              className={cn("p-2 rounded-md transition-all border", showBoxes ? "bg-accent/10 text-accent border-accent/30" : "bg-[#0a0a0f] text-muted")}
            >
              <BoxSelect className="w-4 h-4" />
            </button>
            <button
              onClick={resetZoom}
              className="p-2 rounded-md transition-all bg-[#0a0a0f] text-muted border border-[#1e1e2e] hover:text-white"
            >
              <span className="text-[10px] font-bold px-1">{Math.round(scale * 100)}%</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
