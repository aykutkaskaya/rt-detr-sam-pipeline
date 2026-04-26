import { AnalyzeRequestParams, AnalyzeResponse, HealthResponse, AnalyzePointRequestParams } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return {
      status: "error",
      device: "unknown",
      models_loaded: false
    };
  }
}

export async function analyzeImage(params: AnalyzeRequestParams, abortSignal?: AbortSignal): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('image', params.image);

  if (params.conf_threshold !== undefined) formData.append('conf_threshold', params.conf_threshold.toString());
  if (params.slice_index !== undefined) formData.append('slice_index', params.slice_index.toString());
  if (params.compute_device !== undefined) formData.append('compute_device', params.compute_device);
  if (params.window_center !== undefined) formData.append('window_center', params.window_center.toString());
  if (params.window_width !== undefined) formData.append('window_width', params.window_width.toString());
  if (params.detr_weight_path !== undefined) formData.append('detr_weight_path', params.detr_weight_path);
  if (params.sam_weight_path !== undefined) formData.append('sam_weight_path', params.sam_weight_path);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
    signal: abortSignal
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`);
  }

  return await response.json();
}

export async function analyzePoint(params: AnalyzePointRequestParams): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('image', params.image, 'slice.png');
  formData.append('points', JSON.stringify(params.points));
  formData.append('labels', JSON.stringify(params.labels));
  if (params.compute_device) formData.append('compute_device', params.compute_device);

  const response = await fetch(`${API_BASE_URL}/analyze/point`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Point Analysis failed: ${response.statusText}`);
  }

  return await response.json();
}

export async function applyWindowing(params: {
  image: File;
  slice_index?: number;
  window_center?: number;
  window_width?: number;
}): Promise<{ base_url: string; slice_index: number; total_slices: number }> {
  const formData = new FormData();
  formData.append('image', params.image);
  if (params.slice_index !== undefined) formData.append('slice_index', params.slice_index.toString());
  if (params.window_center !== undefined) formData.append('window_center', params.window_center.toString());
  if (params.window_width !== undefined) formData.append('window_width', params.window_width.toString());

  const response = await fetch(`${API_BASE_URL}/windowing`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Windowing failed: ${response.statusText}`);
  }

  return await response.json();
}
