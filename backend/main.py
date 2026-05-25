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
            
            if torch.cuda.is_available():
                device = "cuda"
                torch.cuda.empty_cache()
            elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                device = "mps"
                log.info("Using Apple Silicon GPU (MPS)")
            else:
                device = "cpu"
            
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
    lifespan=lifespan,
    redoc_url=None
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
    if torch.cuda.is_available():
        device = "cuda"
        torch.cuda.empty_cache()
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device = "mps"
    else:
        device = "cpu"
    
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

@app.get("/redoc", include_in_schema=False)
async def custom_redoc_html():
    from fastapi.responses import HTMLResponse
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>🧠 RT-DETR+SAM Pipeline API Docs</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-family: 'Outfit', sans-serif;
          }
          
          /* Custom Premium Light Sticky Header */
          .api-header {
            position: sticky;
            top: 0;
            z-index: 1000;
            height: 60px;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            color: #0f172a;
          }
          
          .header-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            font-size: 1.15rem;
            letter-spacing: -0.02em;
          }
          
          .header-brand span.badge {
            background: rgba(16, 185, 129, 0.1);
            color: #059669;
            font-size: 0.75rem;
            padding: 2px 8px;
            border-radius: 9999px;
            border: 1px solid rgba(16, 185, 129, 0.2);
            font-weight: 500;
          }
          
          .header-links a {
            color: #475569;
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.2s;
            font-weight: 500;
          }
          
          .header-links a:hover {
            color: #10b981;
          }
          
          #redoc-container {
            margin-top: 0px;
          }
          
          .menu-content {
            border-right: 1px solid #e2e8f0 !important;
          }
          
          /* Custom light scrollbars */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #ffffff;
          }
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="api-header">
          <div class="header-brand">
            <span>🧠</span> RT-DETR+SAM Pipeline API Docs <span class="badge">v1.0.0</span>
          </div>
          <div class="header-links">
            <a href="https://github.com/aykutkaskaya/rt-detr-sam-pipeline" target="_blank">View GitHub Repository →</a>
          </div>
        </div>
        
        <div id="redoc-container"></div>
        
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
        <script>
          const theme = {
            spacing: {
              unit: 8,
              sectionHorizontal: 40,
              sectionVertical: 45
            },
            breakpoints: {
              small: '50rem',
              medium: '75rem',
              large: '105rem'
            },
            colors: {
              tonalOffset: 0.2,
              primary: {
                main: '#10b981', // Emerald
                light: '#34d399',
                dark: '#059669',
                contrastText: '#ffffff'
              },
              success: {
                main: '#10b981',
                light: '#e6f4ea',
                contrastText: '#137333'
              },
              warning: {
                main: '#f59e0b',
                light: '#fef3c7',
                contrastText: '#b45309'
              },
              error: {
                main: '#ef4444',
                light: '#fee2e2',
                contrastText: '#b91c1c'
              },
              text: {
                primary: '#0f172a', // Slate 900
                secondary: '#475569' // Slate 600
              },
              border: {
                light: '#e2e8f0', // Slate 200
                dark: '#cbd5e1'   // Slate 300
              },
              responses: {
                success: {
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  tabTextColor: '#10b981'
                },
                error: {
                  color: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  tabTextColor: '#ef4444'
                }
              },
              http: {
                get: '#2563eb',
                post: '#10b981',
                put: '#d97706',
                delete: '#dc2626'
              }
            },
            typography: {
              fontSize: '14px',
              lineHeight: '1.6em',
              fontFamily: '"Outfit", sans-serif',
              headings: {
                fontFamily: '"Outfit", sans-serif',
                fontWeight: '600',
                lineHeight: '1.4em'
              },
              code: {
                fontSize: '13px',
                fontFamily: '"Fira Code", monospace',
                wrap: true,
                backgroundColor: '#f1f5f9',
                color: '#0f172a'
              }
            },
            sidebar: {
              width: '280px',
              backgroundColor: '#f8fafc', // Soft gray-blue background
              textColor: '#475569',
              activeTextColor: '#10b981',
              groupItems: {
                textTransform: 'uppercase'
              },
              level1Items: {
                textTransform: 'none'
              },
              arrow: {
                size: '1.5em',
                color: '#94a3b8'
              }
            },
            rightPanel: {
              backgroundColor: '#0f172a', // Clean dark code blocks side (Standard premium contrast)
              width: '40%',
              textColor: '#f8fafc'
            }
          };

          Redoc.init('/openapi.json', {
            theme: theme,
            expandResponses: '200,201',
            hideDownloadButton: false,
            pathInMiddlePanel: true,
            requiredPropsFirst: true,
            sortPropsAlphabetically: false,
            hideLoading: true
          }, document.getElementById('redoc-container'));
        </script>
      </body>
    </html>
    """
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    log.info(f"Starting uvicorn server on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

