from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional

import cv2
import numpy as np


def overlay_results(
    image_rgb: np.ndarray,
    detections: Dict[str, np.ndarray],
    class_names: Optional[List[str]] = None,
) -> np.ndarray:
    canvas = image_rgb.copy()

    for idx, box in enumerate(detections["boxes"]):
        x1, y1, x2, y2 = box.astype(int)
        score = float(detections["scores"][idx])
        cls_id = int(detections["classes"][idx])
        label = f"{class_names[cls_id] if class_names else cls_id}: {score:.2f}"

        cv2.rectangle(canvas, (x1, y1), (x2, y2), (255, 0, 0), 2)
        cv2.putText(
            canvas,
            label,
            (x1, max(y1 - 8, 0)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 0, 0),
            2,
            cv2.LINE_AA,
        )

    if "masks" in detections and len(detections["masks"]) > 0:
        colors = [
            (0, 255, 136), # Spring Green (Accent)
            (0, 180, 255), # Deep Sky Blue
            (255, 60, 120), # Pinkish Red
            (255, 200, 0),  # Amber/Yellow
            (150, 0, 255),  # Purple
            (0, 255, 255),  # Cyan
            (255, 120, 0)   # Orange
        ]
        
        for i, mask in enumerate(detections["masks"]):
            color = colors[i % len(colors)]
            mask_layer = np.zeros_like(canvas)
            mask_layer[mask] = color
            
            # Apply alpha blending only on the mask area
            canvas = np.where(mask[..., None], cv2.addWeighted(canvas, 0.6, mask_layer, 0.4, 0), canvas)

    return canvas


def save_rgb_image(image_rgb: np.ndarray, output_path: str | Path) -> Path:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image_bgr = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)
    cv2.imwrite(str(output_path), image_bgr)
    return output_path