from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

import cv2
import numpy as np


IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}


def load_image_bgr(image_path: str | Path) -> np.ndarray:
    image_path = Path(image_path)
    image_data = np.fromfile(str(image_path), dtype=np.uint8)
    if image_data.size == 0:
        raise FileNotFoundError(f"Image file is empty or missing: {image_path}")
    image = cv2.imdecode(image_data, cv2.IMREAD_COLOR)
    if image is None:
        try:
            from PIL import Image
            import io
            pil_img = Image.open(io.BytesIO(image_data)).convert('RGB')
            # PIL is RGB, OpenCV is BGR
            image = np.array(pil_img)[:, :, ::-1].copy()
        except Exception as e:
            raise ValueError(f"OpenCV and PIL could not decode the image: {image_path}. Error: {e}")
    return image


def iter_image_paths(path: str | Path) -> List[Path]:
    path = Path(path)
    if path.is_file():
        return [path]
    if path.is_dir():
        return sorted([p for p in path.rglob("*") if p.suffix.lower() in IMAGE_SUFFIXES])
    raise FileNotFoundError(f"Input path does not exist: {path}")


def ensure_dir(path: str | Path) -> Path:
    path = Path(path)
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_json(data: Dict, output_path: str | Path) -> Path:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    def _convert(obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.floating, np.integer)):
            return obj.item()
        raise TypeError(f"Unsupported type for JSON serialization: {type(obj)}")

    with output_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=_convert)
    return output_path


def save_mask(mask: np.ndarray, output_path: str | Path) -> Path:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    mask_uint8 = (mask.astype(np.uint8)) * 255
    cv2.imwrite(str(output_path), mask_uint8)
    return output_path