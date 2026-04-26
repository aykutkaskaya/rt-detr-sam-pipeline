from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import cv2
import numpy as np

from .detection import DetectionModel
from .segmentation import SegmentationModel
from .io_utils import load_image_bgr, save_json, save_mask
from .visualization import overlay_results, save_rgb_image
from logger import get_logger

log = get_logger("ml.pipeline")

@dataclass
class PipelineResult:
    image_path: str
    overlay_path: str
    json_path: str
    mask_paths: List[str]
    metadata: List[dict]
    sam_details: List[dict] = None


class DETRSAMPipeline:
    """End-to-end local inference pipeline."""

    def __init__(
        self,
        detection_weights: str | Path,
        sam_checkpoint: str | Path,
        sam_model_type: str = "vit_h",
        device: str = "cpu",
        class_names: Optional[List[str]] = None,
    ) -> None:
        self.device = device
        self.class_names = class_names
        log.info(f"Initializing DetectionModel with {detection_weights} on {device}")
        self.detector = DetectionModel(detection_weights, device=device)
        log.info(f"Initializing SegmentationModel ({sam_model_type}) with {sam_checkpoint} on {device}")
        self.segmenter = SegmentationModel(
            checkpoint_path=sam_checkpoint,
            model_type=sam_model_type,
            device=device,
        )
        log.info("Pipeline initialized successfully.")

    def run_on_image(
        self,
        image_path: str | Path,
        output_dir: str | Path,
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        compute_device: str = "auto"
    ) -> PipelineResult:
        image_path = Path(image_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        image_bgr = load_image_bgr(image_path)
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        target_device = self.device if compute_device == "auto" else compute_device
        self.segmenter.to(target_device)

        detections = self.detector.predict(
            image_bgr=image_bgr,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold,
            device=target_device,
        )
        masks = self.segmenter.predict_masks(image_rgb=image_rgb, boxes_xyxy=detections["boxes"])
        detections["masks"] = masks

        stem = image_path.stem
        overlay = overlay_results(image_rgb=image_rgb, detections=detections, class_names=self.class_names)
        overlay_path = save_rgb_image(overlay, output_dir / f"{stem}_overlay.png")
        json_path = save_json(detections, output_dir / f"{stem}_detections.json")

        mask_paths: List[str] = []
        metadata: List[dict] = []
        
        for idx, mask in enumerate(masks):
            mask_path = save_mask(mask, output_dir / f"{stem}_mask_{idx:02d}.png")
            mask_paths.append(str(mask_path))
            
            # Maske istatistiklerini hesapla
            area = int(np.sum(mask)) # Piksel sayısı
            bbox = detections["boxes"][idx]
            width = int(bbox[2] - bbox[0])
            height = int(bbox[3] - bbox[1])

            metadata.append({
                "index": idx,
                "area_px": area,
                "width_px": width,
                "height_px": height,
                "bbox": bbox.tolist(),
                "confidence": float(detections["scores"][idx]),
                "mask_path": str(mask_path)
            })

        return PipelineResult(
            image_path=str(image_path),
            overlay_path=str(overlay_path),
            json_path=str(json_path),
            mask_paths=mask_paths,
            metadata=metadata
        )

    def run_interactive_prompt(
        self,
        image_path: str | Path,
        output_dir: str | Path,
        point_coords: List[List[int]],
        point_labels: List[int],
        compute_device: str = "auto"
    ) -> PipelineResult:
        image_path = Path(image_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        image_bgr = load_image_bgr(image_path)
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        target_device = self.device if compute_device == "auto" else compute_device
        log.debug(f"Moving SAM to {target_device} for interactive prompt")
        self.segmenter.to(target_device)

        all_masks = []
        for i, (coord, label) in enumerate(zip(point_coords, point_labels)):
            log.debug(f"Prompting mask {i} for point {coord}")
            m = self.segmenter.predict_masks_with_points(image_rgb, [coord], [label])
            all_masks.append(m[0])
            
        if not all_masks:
            masks = np.empty((0, image_rgb.shape[0], image_rgb.shape[1]), dtype=bool)
        else:
            masks = np.stack(all_masks, axis=0)
        
        detections = {
            "boxes": np.empty((0, 4), dtype=np.float32),
            "scores": np.empty((0,), dtype=np.float32),
            "classes": np.empty((0,), dtype=np.int32),
            "masks": masks
        }


        stem = image_path.stem
        overlay = overlay_results(image_rgb=image_rgb, detections=detections, class_names=self.class_names)
        overlay_path = save_rgb_image(overlay, output_dir / f"{stem}_interactive_overlay.png")
        json_path = save_json(detections, output_dir / f"{stem}_interactive_detections.json")

        mask_paths: List[str] = []
        sam_details: List[dict] = []

        for i, mask in enumerate(all_masks):
            mask_filename = f"{stem}_interactive_mask_{i:02d}.png"
            mask_path = save_mask(mask, output_dir / mask_filename)
            mask_paths.append(str(mask_path))
            
            area = int(np.sum(mask))
            y_indices, x_indices = np.where(mask)
            if len(y_indices) > 0:
                y1, y2 = np.min(y_indices), np.max(y_indices)
                x1, x2 = np.min(x_indices), np.max(x_indices)
                bbox = [float(x1), float(y1), float(x2), float(y2)]
            else:
                bbox = [0.0, 0.0, 0.0, 0.0]

            sam_details.append({
                "index": i + 1,
                "type": "manual_segmentation",
                "area_px": area,
                "bbox": bbox,
                "mask_path": str(mask_path)
            })
            
        metadata = []

        return PipelineResult(
            image_path=str(image_path),
            overlay_path=str(overlay_path),
            json_path=str(json_path),
            mask_paths=mask_paths,
            metadata=metadata,
            sam_details=sam_details
        )