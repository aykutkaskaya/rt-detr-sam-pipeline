export interface TumorMetadata {
  index: number;
  area_px: number;
  width_px: number;
  height_px: number;
  bbox: [number, number, number, number];
  confidence: number;
}

export interface AnalyzeResponse {
  overlay_url: string;
  base_url?: string;
  mask_urls: string[];
  metadata: TumorMetadata[];
  json_output: {
    volume_info?: {
      total_slices: number;
      active_slice: number;
      is_medical_volume: boolean;
    };
    [key: string]: any;
  };
}

export interface HealthResponse {
  status: string;
  device: string;
  models_loaded: boolean;
  model_details?: Record<string, {
    size_mb: number;
    hash: string;
    status?: string;
  }>;
  system_info?: {
    os: string;
    cpu: string;
    ram_gb: string;
    gpu: string;
    vram_gb?: string;
  };
}

export interface AnalyzeRequestParams {
  image: File;
  conf_threshold?: number;
  slice_index?: number;
  compute_device?: 'auto' | 'cpu' | 'cuda' | 'mps';
  window_center?: number;
  window_width?: number;
  detr_weight_path?: string;
  sam_weight_path?: string;
}

export interface AnalyzePointRequestParams {
  image: Blob;
  points: number[][];
  labels: number[];
  compute_device?: 'auto' | 'cpu' | 'cuda' | 'mps';
}
