import os
import sys
import urllib.request
import hashlib
from logger import get_logger

log = get_logger("weights_downloader")

REPO_ID = "aykutkaskaya/rtdetr-brain-tumor-runs"
BASE_URL = f"https://huggingface.co/{REPO_ID}/resolve/main"

MODELS = {
    "rtdetr_best.pt": f"{BASE_URL}/run14/best.pt",
    "sam_vit_h_4b8939.pth": f"{BASE_URL}/sam/sam_vit_h_4b8939.pth"
}

def calculate_md5(filepath):
    """Calculates MD5 hash of a file in chunks for verification."""
    hash_md5 = hashlib.md5()
    try:
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except Exception:
        return "unknown"

_MODEL_DETAILS_CACHE = {}

def get_model_details(models_dir):
    """Returns details (size, hash) for all expected models. Uses cache for efficiency."""
    global _MODEL_DETAILS_CACHE
    
    details = {}
    for filename in MODELS.keys():
        filepath = os.path.join(models_dir, filename)
        
        # If file doesn't exist, it's missing (don't cache this as it might change)
        if not os.path.exists(filepath):
            details[filename] = {"status": "missing"}
            continue
            
        # If already cached, use it
        if filename in _MODEL_DETAILS_CACHE:
            details[filename] = _MODEL_DETAILS_CACHE[filename]
            continue
            
        # Otherwise, calculate and cache
        log.info(f"Calculating hash for {filename} (first time)...")
        details[filename] = {
            "size_mb": round(os.path.getsize(filepath) / (1024 * 1024), 2),
            "hash": calculate_md5(filepath)
        }
        _MODEL_DETAILS_CACHE[filename] = details[filename]
        
    return details

def get_remote_file_size(url):
    """Gets the size of a remote file in MB using a HEAD request."""
    try:
        with urllib.request.urlopen(urllib.request.Request(url, method='HEAD')) as response:
            size = int(response.headers.get('Content-Length', 0))
            return size / (1024 * 1024)
    except:
        return 0

def report_progress(block_num, block_size, total_size):
    """Callback function for urllib.request.urlretrieve to show progress."""
    downloaded = block_num * block_size
    percent = downloaded * 100 / total_size if total_size > 0 else 0
    percent = min(100, percent)
    
    sys.stdout.write(f"\r[PROGRESS] {percent:.1f}% ({downloaded / (1024 * 1024):.1f} MB)")
    sys.stdout.flush()

def ensure_weights_exist():
    """Checks if weights exist, and downloads them if they don't, after confirmation."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    models_dir = os.environ.get("MODELS_DIR")
    if not models_dir:
        project_root = os.path.dirname(backend_dir)
        models_dir = os.path.join(project_root, "models")
        if not os.path.exists(models_dir) and os.path.exists(os.path.join(backend_dir, "models")):
            models_dir = os.path.join(backend_dir, "models")
    
    if not os.path.exists(models_dir):
        os.makedirs(models_dir, exist_ok=True)
        
    to_download = [f for f in MODELS.keys() if not os.path.exists(os.path.join(models_dir, f))]
    
    if not to_download:
        return

    print("\n" + "="*50)
    print("MISSING MODEL WEIGHTS DETECTED")
    print("="*50)
    print("The following files need to be downloaded from Hugging Face:")
    
    total_mb = 0
    download_info = []
    for filename in to_download:
        size_mb = get_remote_file_size(MODELS[filename])
        total_mb += size_mb
        download_info.append((filename, size_mb))
        print(f" - {filename}: {size_mb:.2f} MB")
    
    print("-" * 50)
    print(f"Total Download Size: {total_mb:.2f} MB")
    print("="*50)
    
    confirm = input("\nWould you like to download these weights now? (y/n): ").lower().strip()
    
    if confirm != 'y':
        print("\nDownload cancelled. The application may not function correctly without weights.")
        log.warning("User cancelled the weights download.")
        return

    log.info("Starting automatic download...")
    
    for filename in to_download:
        url = MODELS[filename]
        filepath = os.path.join(models_dir, filename)
        
        log.info(f"Downloading {filename}...")
        try:
            urllib.request.urlretrieve(url, filepath, reporthook=report_progress)
            print()
            log.info(f"Successfully downloaded {filename}")
        except Exception as e:
            log.error(f"Failed to download {filename}: {e}")
            if os.path.exists(filepath):
                os.remove(filepath)
            raise e

if __name__ == "__main__":
    ensure_weights_exist()
