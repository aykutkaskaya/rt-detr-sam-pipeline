#!/usr/bin/env bash

echo "Checking NVIDIA GPU..."

if command -v nvidia-smi &> /dev/null
then
    echo "NVIDIA GPU detected. Installing CUDA version..."
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
else
    echo "No NVIDIA GPU detected. Installing CPU version..."
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
fi

pip install -r requirements.txt

echo "Installation completed."
