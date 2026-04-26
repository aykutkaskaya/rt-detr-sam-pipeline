# Frontend State Management Workflow

This document explains the centralized state management architecture of the RT-DETR+SAM Pipeline React frontend.

## 1. Centralized Store (`useAppStore.ts`)
The application utilizes **Zustand** to maintain a single source of truth for all complex application states, eliminating prop-drilling and deeply nested React contexts.

### 1.1. State Categories
The store categorizes variables into logical units:
- **File & Result State:** Stores the uploaded `File`, the `AnalyzeResponse` payload (`result`, `baseResult`), and system health status.
- **Config State:** Maintains inference parameters such as `computeDevice` (CPU/CUDA), `confThreshold`, and paths to model weights.
- **Volume State:** Manages 3D specific parameters including `activeSlice`, `totalSlices`, `windowCenter`, and `windowWidth`.
- **UI & Tool State:** Tracks the current interaction `mode` (slider, magnifier, point), `logs` for the console, and coordinate lists for interactive prompting (`interactivePoints`).

### 1.2. Asynchronous Actions
Instead of cluttering the view components, all API communication is handled by asynchronous actions defined within the store:
- `fetchHealth`: Pings the `/api/health` endpoint on mount to detect CUDA availability and model loading status.
- `handleAnalyze`: Triggers the `POST /analyze` workflow, handles the resulting JSON payload, maps the returned Base64 overlays to the store, and updates the console logs dynamically.
- `runSAMPrompt`: Collects the `interactivePoints`, packages them into a spatial prompt payload, and calls `POST /analyze/point`. It gracefully merges the returned localized segmentation masks with the existing image state.
