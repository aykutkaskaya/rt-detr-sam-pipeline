from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

import torch


def save_torch_checkpoint(
    model: torch.nn.Module,
    output_path: str | Path,
    metadata: Dict[str, Any] | None = None,
) -> Path:
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "state_dict": model.state_dict(),
        "metadata": metadata or {},
    }
    torch.save(payload, output_path)
    return output_path


def load_torch_checkpoint(
    model: torch.nn.Module,
    checkpoint_path: str | Path,
    map_location: str = "cpu",
) -> Dict[str, Any]:
    checkpoint = torch.load(checkpoint_path, map_location=map_location)
    state_dict = checkpoint["state_dict"] if isinstance(checkpoint, dict) and "state_dict" in checkpoint else checkpoint
    model.load_state_dict(state_dict, strict=False)
    return checkpoint if isinstance(checkpoint, dict) else {"metadata": {}}