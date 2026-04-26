import { create } from 'zustand';
import { AnalyzeResponse, HealthResponse } from '../lib/types';
import { checkHealth, analyzeImage, analyzePoint, applyWindowing } from '../lib/api';

interface AppState {
  // File & Result State
  file: File | null;
  imagePreview: string | null;
  isScanning: boolean;
  isSegmenting: boolean;
  result: AnalyzeResponse | null;
  baseResult: AnalyzeResponse | null;
  error: string | null;
  health: HealthResponse | null;

  // Config State
  computeDevice: 'auto' | 'cpu' | 'cuda';
  confThreshold: number;
  detrWeightPath: string;
  samWeightPath: string;

  // Volume State
  activeSlice: number | undefined;
  totalSlices: number | undefined;
  windowCenter: number | undefined;
  windowWidth: number | undefined;

  // UI & Tool State
  mode: 'slider' | 'magnifier' | 'point';
  interactivePoints: { x: number, y: number, label: number }[];
  activePointLabel: number;
  logs: string[];
  isConsoleOpen: boolean;

  // Setters
  setFile: (file: File | null) => void;
  setImagePreview: (url: string | null) => void;
  setIsScanning: (scanning: boolean) => void;
  setIsSegmenting: (segmenting: boolean) => void;
  setResult: (result: AnalyzeResponse | null | ((prev: AnalyzeResponse | null) => AnalyzeResponse | null)) => void;
  setBaseResult: (result: AnalyzeResponse | null) => void;
  setError: (error: string | null) => void;
  setHealth: (health: HealthResponse | null) => void;

  setComputeDevice: (device: 'auto' | 'cpu' | 'cuda') => void;
  setConfThreshold: (threshold: number) => void;
  setDetrWeightPath: (path: string) => void;
  setSamWeightPath: (path: string) => void;

  setActiveSlice: (slice: number | undefined) => void;
  setTotalSlices: (slices: number | undefined) => void;
  setWindowCenter: (center: number | undefined) => void;
  setWindowWidth: (width: number | undefined) => void;

  setMode: (mode: 'slider' | 'magnifier' | 'point') => void;
  setInteractivePoints: (points: { x: number, y: number, label: number }[]) => void;
  setActivePointLabel: (label: number) => void;
  addLog: (msg: string) => void;
  setLogs: (logs: string[]) => void;
  setIsConsoleOpen: (isOpen: boolean) => void;
  
  clearSetup: () => void;

  // Async Actions
  handleImageSelected: (file: File) => void;
  handleAnalyze: (overrideSlice?: number) => Promise<void>;
  runSAMPrompt: (points: { x: number, y: number, label: number }[]) => Promise<void>;
  handlePointClick: (x: number, y: number) => void;
  handlePointDelete: (index: number) => void;
  clearInteractivePoints: () => void;
  handleSliceChange: (newSlice: number) => void;
  fetchHealth: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // File & Result State
  file: null,
  imagePreview: null,
  isScanning: false,
  isSegmenting: false,
  result: null,
  baseResult: null,
  error: null,
  health: null,

  // Config State
  computeDevice: 'cpu',
  confThreshold: 0.75,
  detrWeightPath: './weights/rtdetr.pt',
  samWeightPath: './weights/sam_vit_h.pth',

  // Volume State
  activeSlice: undefined,
  totalSlices: undefined,
  windowCenter: undefined,
  windowWidth: undefined,

  // UI & Tool State
  mode: 'slider',
  interactivePoints: [],
  activePointLabel: 1,
  logs: [],
  isConsoleOpen: true,

  // Setters
  setFile: (file) => set({ file }),
  setImagePreview: (url) => set({ imagePreview: url }),
  setIsScanning: (isScanning) => set({ isScanning }),
  setIsSegmenting: (isSegmenting) => set({ isSegmenting }),
  setResult: (updater) => set((state) => ({ 
    result: typeof updater === 'function' ? updater(state.result) : updater 
  })),
  setBaseResult: (baseResult) => set({ baseResult }),
  setError: (error) => set({ error }),
  setHealth: (health) => set({ health }),

  setComputeDevice: (computeDevice) => set({ computeDevice }),
  setConfThreshold: (confThreshold) => set({ confThreshold }),
  setDetrWeightPath: (detrWeightPath) => set({ detrWeightPath }),
  setSamWeightPath: (samWeightPath) => set({ samWeightPath }),

  setActiveSlice: (activeSlice) => set({ activeSlice }),
  setTotalSlices: (totalSlices) => set({ totalSlices }),
  setWindowCenter: (windowCenter) => set({ windowCenter }),
  setWindowWidth: (windowWidth) => set({ windowWidth }),

  setMode: (mode) => {
    get().addLog(`[SYSTEM] Switched to ${mode.toUpperCase()} mode.`);
    set({ mode });
  },
  setInteractivePoints: (interactivePoints) => set({ interactivePoints }),
  setActivePointLabel: (activePointLabel) => set({ activePointLabel }),
  addLog: (msg) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    set((state) => ({ logs: [...state.logs, `[${time}] ${msg}`] }));
  },
  setLogs: (logs) => set({ logs }),
  setIsConsoleOpen: (isConsoleOpen) => set({ isConsoleOpen }),
  
  clearSetup: () => set({
    file: null,
    imagePreview: null,
    result: null,
    baseResult: null,
    error: null,
    activeSlice: undefined,
    interactivePoints: [],
    windowCenter: undefined,
    windowWidth: undefined,
    totalSlices: undefined,
    logs: [],
    isScanning: false,
    isSegmenting: false
  }),

  // Actions
  fetchHealth: async () => {
    try {
      const data = await checkHealth();
      set({ health: data });
      
      if (data.device === 'CUDA') {
        set({ computeDevice: 'cuda' });
        // Only log once to avoid spam during polling
        if (!get().logs.some(l => l.includes('CUDA detected'))) {
          get().addLog('🚀 CUDA detected! GPU acceleration enabled.');
        }
      } else {
        set({ computeDevice: 'cpu' });
      }
      
      // If models are still loading, poll again in 2 seconds
      if (data.models_loading) {
        setTimeout(() => get().fetchHealth(), 2000);
      } else if (data.models_loaded) {
        // Log weight verification once when loading finishes
        if (data.model_details && !get().logs.some(l => l.includes('[WEIGHTS]'))) {
          Object.entries(data.model_details).forEach(([name, info]) => {
            if (info.status === 'missing') {
              get().addLog(`❌ [WEIGHTS] ${name} is MISSING!`);
            } else {
              get().addLog(`🛡️ [WEIGHTS] ${name} verified (${info.size_mb} MB).`);
            }
          });
        }
      }
    } catch {
      set({ health: { status: 'error', device: 'unknown', models_loaded: false, models_loading: false } });
      // Retry connection after 5 seconds if backend is not reachable yet (e.g. still starting container)
      setTimeout(() => get().fetchHealth(), 5000);
    }
  },

  handleImageSelected: (selectedFile: File) => {
    const isMedical = selectedFile.name.toLowerCase().match(/\.(dcm|dicom|nii|nii\.gz)$/);
    set({
      file: selectedFile,
      imagePreview: isMedical ? 'MEDICAL_PLACEHOLDER' : URL.createObjectURL(selectedFile),
      result: null,
      baseResult: null,
      error: null,
      activeSlice: undefined,
      interactivePoints: [],
      windowCenter: undefined,
      windowWidth: undefined,
      totalSlices: undefined,
      logs: []
    });
    get().addLog(`Loaded image: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`);
  },

  handleAnalyze: async (overrideSlice?: number) => {
    const state = get();
    if (!state.file) return;

    const sliceToAnalyze = overrideSlice !== undefined ? overrideSlice : state.activeSlice;

    set({ isScanning: true, error: null, logs: [], isConsoleOpen: true });
    state.addLog(`Starting analysis: ${state.file.name}${sliceToAnalyze !== undefined ? ` [Slice: ${sliceToAnalyze}]` : ''}`);
    state.addLog(`Parameters: conf=${state.confThreshold}`);

    const isMock = state.health?.status === 'error';

    try {
      if (isMock) {
        state.addLog(`WARN: System is in MOCK mode. Generating simulated response...`);
        await new Promise(res => setTimeout(res, 3500));
        const mockResult = {
          overlay_url: state.imagePreview!,
          mask_urls: [state.imagePreview!, state.imagePreview!],
          metadata: [
            { index: 1, area_px: 4500, width_px: 120, height_px: 135, bbox: [50, 60, 120, 135] as [number,number,number,number], confidence: 0.92 },
            { index: 2, area_px: 800, width_px: 40, height_px: 50, bbox: [200, 210, 40, 50] as [number,number,number,number], confidence: 0.81 }
          ],
          json_output: { status: "Demo Mode (Mocked)", configuration: { confThreshold: state.confThreshold } },
          base_url: state.imagePreview!
        };
        set({ result: mockResult, baseResult: mockResult });
        state.addLog(`✅ SUCCESS: Mock analysis complete.`);
      } else {
        state.addLog(`POST /api/analyze...`);
        const startTime = Date.now();
        const res = await analyzeImage({
          image: state.file,
          conf_threshold: state.confThreshold,
          slice_index: sliceToAnalyze,
          compute_device: state.computeDevice,
          window_center: state.windowCenter,
          window_width: state.windowWidth,
          detr_weight_path: state.detrWeightPath,
          sam_weight_path: state.samWeightPath
        });
        const elapsed = Date.now() - startTime;

        if (res.json_output?.system_status?.execution_time_ms) {
          state.addLog(`⏱️ Inference Execution Time: ${res.json_output.system_status.execution_time_ms}ms`);
        }
        state.addLog(`✅ SUCCESS: Total roundtrip response in ${elapsed}ms.`);

        if (res.json_output?.volume_info?.is_medical_volume) {
          set({
            totalSlices: res.json_output.volume_info.total_slices,
            activeSlice: res.json_output.volume_info.active_slice
          });
        }

        if (res.base_url) {
          set({ imagePreview: res.base_url });
        }

        if (res.metadata?.length) {
          state.addLog(`✅ Detected ${res.metadata.length} anomalies/tumors.`);
        } else {
          state.addLog(`⚠️ No anomalies detected.`);
        }
        set({ result: res, baseResult: res, mode: 'slider', interactivePoints: [] });
      }
    } catch (err: any) {
      state.addLog(`ERROR: ${err.message || 'Analysis failed.'}`);
      set({ error: err.message || 'Analysis failed. Make sure the FastAPI server is running.' });
    } finally {
      set({ isScanning: false });
    }
  },

  runSAMPrompt: async (points: { x: number, y: number, label: number }[]) => {
    const state = get();
    let sourceUrl = state.result?.base_url;
    if (!sourceUrl && state.imagePreview && state.imagePreview !== 'MEDICAL_PLACEHOLDER') {
      sourceUrl = state.imagePreview;
    }

    if (!sourceUrl) {
      state.addLog('Cannot run SAM: No image source available.');
      return;
    }

    set({ isSegmenting: true });
    try {
      const resBlob = await fetch(sourceUrl).then(r => r.blob());

      const naturalW = state.result?.metadata?.[0]?.width_px || 512;
      const naturalH = state.result?.metadata?.[0]?.height_px || 512;

      const pts = points.map(p => [Math.round(p.x * naturalW), Math.round(p.y * naturalH)]);
      const lbls = points.map(p => 1);

      state.addLog(`[SAM] Analyzing ${points.length} separate regions...`);

      const startTime = Date.now();
      const ptRes = await analyzePoint({
        image: resBlob,
        points: pts,
        labels: lbls,
        compute_device: state.computeDevice
      });
      const elapsed = Date.now() - startTime;

      if (ptRes.json_output?.system_status?.execution_time_ms) {
        state.addLog(`⏱️ SAM Core Execution: ${ptRes.json_output.system_status.execution_time_ms}ms`);
      }
      state.addLog(`✅ SAM Segmentation complete (${elapsed}ms).`);
      state.addLog(`ℹ️ NOTICE: Manual selection applied.`);

      set((prev) => ({
        result: prev.result ? {
          ...prev.result,
          overlay_url: ptRes.overlay_url,
          mask_urls: ptRes.mask_urls,
          metadata: ptRes.metadata
        } : ptRes
      }));

    } catch (err: any) {
      state.addLog(`ERROR: ${err.message || 'Interactive analysis failed.'}`);
    } finally {
      set({ isSegmenting: false });
    }
  },

  handlePointClick: (x: number, y: number) => {
    const newPoint = { x, y, label: 1 };
    const updatedPoints = [newPoint];
    set({ interactivePoints: updatedPoints });
    get().addLog(`[SAM] New selection at ${Math.round(x * 100)}%, ${Math.round(y * 100)}% (Previous cleared)`);
    get().runSAMPrompt(updatedPoints);
  },

  handlePointDelete: (index: number) => {
    const updatedPoints = get().interactivePoints.filter((_, i) => i !== index);
    set({ interactivePoints: updatedPoints });
    get().addLog(`[SAM] Deleted point ${index + 1}. Remaining: ${updatedPoints.length}`);

    if (updatedPoints.length === 0) {
      get().clearInteractivePoints();
    } else {
      get().runSAMPrompt(updatedPoints);
    }
  },

  clearInteractivePoints: () => {
    set((state) => ({ interactivePoints: [], result: state.baseResult }));
    get().addLog('[SAM] Cleared all interactive points.');
  },

  handleSliceChange: (newSlice: number) => {
    set({ activeSlice: newSlice });
    get().handleAnalyze(newSlice);
  }

}));
