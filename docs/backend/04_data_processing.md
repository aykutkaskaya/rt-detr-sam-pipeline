# Data Processing and I/O Workflow

This document explains the modules responsible for handling medical imaging formats, standardizing data, and generating visual outputs.

## 1. `backend/ml/medical_io.py`
Handling medical imaging formats (DICOM, NIfTI) requires specialized libraries, as standard image processing libraries (like PIL or OpenCV) cannot parse volumetric or high-bit-depth data.

### Workflow:
1. **Format Detection:** Evaluates the file extension to determine the parser (`nibabel` for NIfTI, `pydicom` for DICOM).
2. **Volume Loading:**
   - **NIfTI:** Extracts the 3D data array. Reorients the axes (e.g., standardizing Z as the primary axis) and applies 90-degree rotations to ensure axial slices are upright.
   - **DICOM:** Parses the pixel array and attempts to read standard DICOM metadata fields like `WindowCenter` and `WindowWidth`.
3. **Slice Extraction:** Slices the 3D NumPy array along the primary axis using the requested `slice_index`.
4. **Windowing (`apply_windowing`):**
   - Applies a linear transformation mapping the raw Hounsfield Units (HU) or voxel intensities to an 8-bit grayscale range (0-255).
   - If explicit window parameters are not provided, it falls back to a robust auto-windowing algorithm using 1st and 99th percentiles to mitigate the effect of extreme outliers.
5. **Color Space Conversion:** Converts the 8-bit grayscale slice into a 3-channel BGR format expected by the downstream neural networks.

## 2. `backend/ml/io_utils.py` & `backend/ml/visualization.py`
These auxiliary modules handle the persistence of data and the creation of diagnostic overlays.

### Workflow:
1. **I/O Operations:** Functions like `load_image_bgr`, `save_json`, and `save_mask` provide standardized wrappers around `cv2` and `json` libraries to ensure robust file encoding and error handling.
2. **Overlay Generation:** 
   - The `overlay_results` function takes the base RGB image and iterates over the detected bounding boxes and masks.
   - It utilizes OpenCV's drawing primitives (`cv2.rectangle`, `cv2.putText`, `cv2.addWeighted`) to render semi-transparent masks and annotated bounding boxes with confidence scores.
   - This composite image acts as the primary visual feedback mechanism for the end-user.
