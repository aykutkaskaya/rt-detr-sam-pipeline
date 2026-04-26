from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

import numpy as np
from ultralytics import RTDETR


class DetectionModel:
    """Wrapper around Ultralytics RT-DETR for local inference."""

    def __init__(self, weights_path: str | Path, device: str = "cpu") -> None:
        self.weights_path = Path(weights_path)
        if not self.weights_path.exists():
            raise FileNotFoundError(f"Detection weights not found: {self.weights_path}")
        self.device = device
        self.model = RTDETR(str(self.weights_path))

    def predict(
        self,
        image_bgr: np.ndarray,
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        device: str | None = None,
    ) -> Dict[str, np.ndarray]:
        if image_bgr is None or image_bgr.size == 0:
            raise ValueError("Input image is empty.")

        safe_conf = max(0.0, float(conf_threshold) - 1e-5)

        results = self.model.predict(
            source=image_bgr,
            conf=safe_conf,
            iou=iou_threshold,
            device=device or self.device,
            verbose=False,
        )
        if not results or results[0].boxes is None:
            return {
                "boxes": np.empty((0, 4), dtype=np.float32),
                "scores": np.empty((0,), dtype=np.float32),
                "classes": np.empty((0,), dtype=np.int32),
            }

        boxes = results[0].boxes.xyxy.detach().cpu().numpy().astype(np.float32)
        scores = results[0].boxes.conf.detach().cpu().numpy().astype(np.float32)
        classes = results[0].boxes.cls.detach().cpu().numpy().astype(np.int32)
        
        mask = scores >= (float(conf_threshold) - 1e-6)
        return {"boxes": boxes[mask], "scores": scores[mask], "classes": classes[mask]}

    def save_weights_copy(self, output_path: str | Path) -> Path:
        """
        Copies the current .pt file to a local destination.
        Useful when consolidating experiment artifacts.
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(self.weights_path.read_bytes())
        return output_path