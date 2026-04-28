#!/usr/bin/env bash
set -e

python -m pip install --upgrade pip

OS="$(uname -s)"

if [[ "$OS" == "Darwin" ]]; then
    echo "[INFO] macOS detected. Installing PyTorch with MPS support..."
    python -m pip uninstall torch torchvision torchaudio -y || true
    python -m pip install torch torchvision torchaudio

elif command -v nvidia-smi &> /dev/null; then
    echo "[INFO] NVIDIA GPU detected. Installing CUDA PyTorch..."
    python -m pip uninstall torch torchvision torchaudio -y || true
    python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128

else
    echo "[INFO] No NVIDIA GPU detected. Installing CPU PyTorch..."
    python -m pip uninstall torch torchvision torchaudio -y || true
    python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
fi

python -m pip install -r requirements.txt

echo "[SUCCESS] Installation completed."
