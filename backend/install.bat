@echo off

echo Checking NVIDIA GPU...

nvidia-smi >nul 2>&1

if %errorlevel% == 0 (
    echo NVIDIA GPU detected. Installing CUDA version...
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
) else (
    echo No GPU detected. Installing CPU version...
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
)

pip install -r requirements.txt

echo Installation completed.
pause
