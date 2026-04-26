from __future__ import annotations

import argparse
from pathlib import Path

import torch

from io_utils import iter_image_paths
from pipeline import DETRSAMPipeline


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Local RT-DETR and SAM-based brain tumor detection and segmentation pipeline."
    )
    parser.add_argument("--input", required=True, help="Path to an input image or a directory of images.")
    parser.add_argument("--output-dir", default="outputs", help="Directory to store overlays, masks, and JSON files.")
    parser.add_argument("--detection-weights", required=True, help="Path to local DETR .pt weights.")
    parser.add_argument("--sam-checkpoint", required=True, help="Path to local SAM .pth checkpoint.")
    parser.add_argument("--sam-model-type", default="vit_h", choices=["vit_b", "vit_l", "vit_h"])
    parser.add_argument("--conf-threshold", type=float, default=0.25)
    parser.add_argument("--iou-threshold", type=float, default=0.45)
    parser.add_argument("--device", default=None, help='Device string such as "cpu", "cuda", or "cuda:0".')
    parser.add_argument(
        "--class-names",
        nargs="*",
        default=["tumor"],
        help="Optional class names in index order. Default assumes a single tumor class.",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    device = args.device or ("cuda:0" if torch.cuda.is_available() else "cpu")

    pipeline = DETRSAMPipeline(
        detection_weights=args.detection_weights,
        sam_checkpoint=args.sam_checkpoint,
        sam_model_type=args.sam_model_type,
        device=device,
        class_names=args.class_names,
    )

    image_paths = iter_image_paths(args.input)
    Path(args.output_dir).mkdir(parents=True, exist_ok=True)

    for image_path in image_paths:
        result = pipeline.run_on_image(
            image_path=image_path,
            output_dir=args.output_dir,
            conf_threshold=args.conf_threshold,
            iou_threshold=args.iou_threshold,
        )
        print(f"Processed: {result.image_path}")
        print(f"  Overlay: {result.overlay_path}")
        print(f"  JSON:    {result.json_path}")
        if result.mask_paths:
            print(f"  Masks:   {len(result.mask_paths)} file(s)")
        else:
            print("  Masks:   none")


if __name__ == "__main__":
    main()