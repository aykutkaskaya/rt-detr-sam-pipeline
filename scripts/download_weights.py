import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from ml.weights_downloader import ensure_weights_exist

if __name__ == "__main__":
    try:
        ensure_weights_exist()
    except KeyboardInterrupt:
        print("\nDownload cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        sys.exit(1)
