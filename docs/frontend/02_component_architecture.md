# Frontend Component Architecture

This document describes the primary React components and their roles within the RT-DETR+SAM Pipeline architecture.

## 1. `App.tsx` (Main View Orchestrator)
The root component serves solely as the structural layout manager. 
- It establishes the main CSS Grid/Flexbox scaffolding.
- It orchestrates the rendering of the `Sidebar`, `ImageUploader`, `ResultTabs`, and `ConsoleTerminal`.
- By delegating all business logic to `useAppStore`, `App.tsx` remains strictly a declarative UI layer.
- Includes a localized `useEffect` for debounced windowing adjustments (`applyWindowing`), ensuring smooth real-time previewing without flooding the backend API.

## 2. Interactive Viewers
### 2.1. `ScanOverlay.tsx`
The most complex visual component, responsible for rendering the primary diagnostic viewport.
- **Base Rendering:** Displays the raw image or the medical slice as the background layer.
- **Tool Modes:**
  - **Slider Mode:** Implements an interactive vertical slider clipping path (`clip-path`) to smoothly transition between the raw image and the annotated segmentation overlay.
  - **Magnifier Mode:** Creates a localized `transform: scale(2.5)` circular lens that follows the pointer coordinate system.
  - **Point Mode (Interactive SAM):** Intercepts pointer events, calculating normalized $x, y$ coordinates $[0, 1]$ mapped to the image's intrinsic dimensions (`naturalWidth/naturalHeight`), and dispatches them to the Zustand store for SAM prompting.
- **SVG Annotations:** Dynamically renders bounding box arrays (`<rect>`) over the image using the metadata provided by the backend, including hover-state tooltips indicating confidence scores and pixel area.

### 2.2. `ResultTabs.tsx`
Provides a multi-view inspection panel.
- Allows switching between the primary **Overlay View**, the isolated **Mask Grid**, the statistical **Tumor Statistics** table, and the raw **JSON Output** viewer.

## 3. Peripheral Components
- **`Sidebar.tsx`:** An encapsulated control panel exposing UI inputs bound directly to the Zustand store (e.g., Confidence threshold sliders, compute device toggles, windowing overrides).
- **`ConsoleTerminal.tsx`:** A simulated terminal interface that subscribes to the `logs` state array, providing real-time technical feedback regarding inference latencies, API payloads, and execution errors.
