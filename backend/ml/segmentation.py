from __future__ import annotations

from pathlib import Path
from typing import List

import numpy as np
import torch
from segment_anything import SamPredictor, sam_model_registry


class SegmentationModel:
    """Wrapper around Meta SAM for box-prompted segmentation."""

    def __init__(
        self,
        checkpoint_path: str | Path,
        model_type: str = "vit_h",
        device: str = "cpu",
    ) -> None:
        checkpoint_path = Path(checkpoint_path)
        if not checkpoint_path.exists():
            raise FileNotFoundError(f"SAM checkpoint not found: {checkpoint_path}")

        self.device = device
        self.model_type = model_type
        sam = sam_model_registry[model_type](checkpoint=str(checkpoint_path))
        
        if device == "cuda":
            try:
                sam.to(device=device)
                print(f"✅ SAM loaded successfully on {device} (Standard Precision)")
            except Exception as e:
                print(f"⚠️ GPU Allocation failed for SAM: {e}. Falling back to CPU mode.")
                sam = sam.to(device="cpu").float()
                self.device = "cpu"
        else:
            sam.to(device=device)
            
        self.predictor = SamPredictor(sam)

    def to(self, device: str):
        if self.device != device:
            self.predictor.model.to(device)
            if device == "cpu":
                self.predictor.model.float()
            self.device = device

    def predict_masks(
        self,
        image_rgb: np.ndarray,
        boxes_xyxy: np.ndarray,
        padding: float = 0.1,
    ) -> np.ndarray:
        self.predictor.set_image(image_rgb)
        h, w = image_rgb.shape[:2]
        masks: List[np.ndarray] = []
        
        device_type = "cuda" if "cuda" in str(self.device) else "cpu"
        
        with torch.autocast(device_type=device_type, enabled=(device_type == "cuda")):
            for box in boxes_xyxy:
                x1, y1, x2, y2 = box
                bw, bh = x2 - x1, y2 - y1
                px1 = max(0, x1 - bw * padding)
                py1 = max(0, y1 - bh * padding)
                px2 = min(w, x2 + bw * padding)
                py2 = min(h, y2 + bh * padding)
                padded_box = np.array([px1, py1, px2, py2])

                predicted_masks, scores, _ = self.predictor.predict(
                    box=padded_box,
                    multimask_output=True,
                )
                best_idx = np.argmax(scores)
                masks.append(predicted_masks[best_idx])

        if not masks:
            return np.empty((0, h, w), dtype=bool)

        return np.stack(masks, axis=0).astype(bool)
        
    def predict_masks_with_points(
        self,
        image_rgb: np.ndarray,
        point_coords: List[List[int]],
        point_labels: List[int],
    ) -> np.ndarray:
        self.predictor.set_image(image_rgb)
        pts = np.array(point_coords)
        lbls = np.array(point_labels)
        
        device_type = "cuda" if "cuda" in str(self.device) else "cpu"
        with torch.autocast(device_type=device_type, enabled=(device_type == "cuda")):
            predicted_masks, scores, _ = self.predictor.predict(
                point_coords=pts,
                point_labels=lbls,
                multimask_output=True,
            )
            best_idx = np.argmax(scores)
            mask = predicted_masks[best_idx]
        
        return np.expand_dims(mask, axis=0).astype(bool)