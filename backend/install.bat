@echo off

echo [INFO] Checking NVIDIA GPU...
nvidia-smi >nul 2>&1

if %errorlevel% == 0 (
    echo [INFO] NVIDIA GPU detected
    set TORCH_URL=https://download.pytorch.org/whl/cu128
) else (
    echo [INFO] No GPU detected, using CPU
    set TORCH_URL=https://download.pytorch.org/whl/cpu
)

echo [INFO] Cleaning previous torch installation...
pip uninstall torch torchvision torchaudio -y

echo [INFO] Installing PyTorch...
pip install torch torchvision torchaudio --index-url %TORCH_URL%

if %errorlevel% neq 0 (
    echo [ERROR] PyTorch installation failed!
    pause
    exit /b 1
)

echo [INFO] Installing requirements...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo [ERROR] Requirements installation failed!
    pause
    exit /b 1
)

echo [SUCCESS] Installation completed!
pause
