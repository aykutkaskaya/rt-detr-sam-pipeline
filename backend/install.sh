#!/usr/bin/env bash

set -e

echo "[INFO] Checking NVIDIA GPU..."

if command -v nvidia-smi &> /dev/null
then
    echo "[INFO] NVIDIA GPU detected"
    TORCH_URL="https://download.pytorch.org/whl/cu128"
else
    echo "[INFO] No GPU detected, using CPU"
    TORCH_URL="https://download.pytorch.org/whl/cpu"
fi

echo "[INFO] Cleaning previous torch installation..."
pip uninstall torch torchvision torchaudio -y || true

echo "[INFO] Installing PyTorch..."
pip install torch torchvision torchaudio --index-url $TORCH_URL

echo "[INFO] Installing requirements..."
pip install -r requirements.txt

echo "[SUCCESS] Installation completed!"
