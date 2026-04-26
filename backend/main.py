import os
import torch
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze
import uvicorn
import sys

os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from ml.pipeline import DETRSAMPipeline
from ml.weights_downloader import ensure_weights_exist, get_model_details
from logger import get_logger

log = get_logger("main")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
MODELS_DIR = os.environ.get("MODELS_DIR")
if not MODELS_DIR:
    PROJECT_ROOT = os.path.dirname(BASE_DIR)
    MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
    if not os.path.exists(MODELS_DIR) and os.path.exists(os.path.join(BASE_DIR, "models")):
        MODELS_DIR = os.path.join(BASE_DIR, "models")

log.info(f"Models directory set to: {MODELS_DIR}")

DETR_WEIGHTS = os.path.join(MODELS_DIR, "rtdetr_best.pt")
SAM_WEIGHTS = os.path.join(MODELS_DIR, "sam_vit_h_4b8939.pth")

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pipeline = None
    app.state.models_loading = True
    app.state.models_error = None
    
    def load_models_sync():
        try:
            log.info("Starting background model loading...")
            ensure_weights_exist()
            
            device = "cuda" if torch.cuda.is_available() else "cpu"
            if device == "cuda":
                torch.cuda.empty_cache()
            
            log.info(f"Loading DETR+SAM on {device}...")
            pipeline = DETRSAMPipeline(
                detection_weights=DETR_WEIGHTS,
                sam_checkpoint=SAM_WEIGHTS,
                sam_model_type="vit_h",
                device=device,
                class_names=["tumor"]
            )
            app.state.pipeline = pipeline
            app.state.models_loading = False
            log.info("✅ ML models loaded and ready in background.")
        except Exception as e:
            app.state.models_loading = False
            app.state.models_error = str(e)
            log.error(f"❌ Failed to load models in background: {e}")

    import threading
    thread = threading.Thread(target=load_models_sync, daemon=True)
    thread.start()
    
    yield
    
    log.info("Shutting down and cleaning up models...")
    app.state.pipeline = None
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

app = FastAPI(
    title="RT-DETR+SAM Pipeline API",
    description="Advanced RT-DETR + Segment Anything (SAM) Pipeline for Medical Image Analysis. Developed by Aykut Kaşkaya (aykut@kaskaya.com)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api")

possible_assets = [
    os.environ.get("ASSETS_DIR"),
    os.path.join(BASE_DIR, "assets"),
    os.path.join(PROJECT_ROOT, "assets"),
]

ASSETS_DIR = None
for path in possible_assets:
    if path and os.path.exists(path) and os.path.isdir(path):
        ASSETS_DIR = path
        break

if ASSETS_DIR:
    log.info(f"✅ Assets directory confirmed at: {ASSETS_DIR}")
    try:
        files = os.listdir(ASSETS_DIR)
        log.info(f"   Files found: {files}")
    except Exception as e:
        log.error(f"   Could not list files in {ASSETS_DIR}: {e}")
    
    abs_assets_path = os.path.abspath(ASSETS_DIR)
    app.mount("/assets", StaticFiles(directory=abs_assets_path), name="assets")
else:
    log.warning(f"⚠️ Assets directory NOT FOUND. Checked: {possible_assets}")

@app.get("/api/debug-assets")
async def debug_assets():
    """Endpoint to debug asset mapping in Docker"""
    res = {
        "ASSETS_DIR": str(ASSETS_DIR),
        "exists": os.path.exists(ASSETS_DIR) if ASSETS_DIR else False,
        "is_dir": os.path.isdir(ASSETS_DIR) if ASSETS_DIR else False,
        "possible_paths": possible_assets,
        "files": []
    }
    if ASSETS_DIR and os.path.exists(ASSETS_DIR):
        try:
            res["files"] = os.listdir(ASSETS_DIR)
        except Exception as e:
            res["error"] = str(e)
    return res

@app.get("/api/health")
async def health_check(request: Request):
    import platform
    import psutil
    
    pipeline_loaded = hasattr(request.app.state, "pipeline") and request.app.state.pipeline is not None
    models_loading = getattr(request.app.state, "models_loading", False)
    models_error = getattr(request.app.state, "models_error", None)
    device = "CUDA" if torch.cuda.is_available() else "CPU"
    
    ram_gb = round(psutil.virtual_memory().total / (1024 ** 3), 1)
    
    gpu_name = "N/A"
    vram_gb = "N/A"
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        total_vram = torch.cuda.get_device_properties(0).total_memory
        vram_gb = f"{round(total_vram / (1024**3), 1)} GB"
    
    def get_cpu_name():
        try:
            import subprocess
            system = platform.system()
            if system == "Windows":
                return subprocess.check_output(["wmic", "cpu", "get", "name"], creationflags=subprocess.CREATE_NO_WINDOW).decode().split("\n")[1].strip()
            elif system == "Darwin":
                return subprocess.check_output(["sysctl", "-n", "machdep.cpu.brand_string"]).decode().strip()
            elif system == "Linux":
                with open("/proc/cpuinfo") as f:
                    for line in f:
                        if "model name" in line:
                            return line.split(":")[1].strip()
        except Exception:
            pass
        return platform.processor() or "Unknown CPU"
    
    return {
        "status": "ok",
        "device": device,
        "models_loaded": pipeline_loaded,
        "models_loading": models_loading,
        "models_error": models_error,
        "model_details": get_model_details(MODELS_DIR),
        "system_info": {
            "os": f"{platform.system()} {platform.release()}",
            "cpu": get_cpu_name(),
            "ram_gb": f"{ram_gb} GB",
            "gpu": gpu_name,
            "vram_gb": vram_gb
        }
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    log.info(f"Starting uvicorn server on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

