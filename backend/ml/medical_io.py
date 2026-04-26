from pathlib import Path
import numpy as np
import cv2
from logger import get_logger

log = get_logger("ml.medical_io")

def apply_windowing(image: np.ndarray, window_center=None, window_width=None) -> np.ndarray:
    """Applies basic windowing if parameters are provided, or standardizes to 8-bit."""
    image = image.astype(np.float32)
    if window_center is not None and window_width is not None:
        img_min = window_center - window_width // 2
        img_max = window_center + window_width // 2
        image = np.clip(image, img_min, img_max)
        image = (image - img_min) / window_width * 255.0
    else:
        img_min = np.percentile(image, 1)
        img_max = np.percentile(image, 99)
        image = np.clip(image, img_min, img_max)
        if img_max > img_min:
            image = (image - img_min) / (img_max - img_min) * 255.0
        else:
            image = np.zeros_like(image)
    
    return image.astype(np.uint8)

def load_nifti_volume(path: str | Path):
    import nibabel as nib
    img = nib.load(str(path))
    data = img.get_fdata()
    
    if data.ndim == 4:
        data = data[:, :, :, 0]
        
    data = np.moveaxis(data, -1, 0)
    data = np.rot90(data, k=1, axes=(1, 2))
    return data

def load_dicom_volume(path: str | Path):
    import pydicom
    dcm = pydicom.dcmread(str(path))
    data = dcm.pixel_array
    
    if data.ndim == 2:
        data = data[np.newaxis, ...]
        
    window_center = getattr(dcm, 'WindowCenter', None)
    window_width = getattr(dcm, 'WindowWidth', None)
    
    # DICOM values can sometimes be MultiValue lists
    if window_center is not None and hasattr(window_center, '__iter__'):
        window_center = window_center[0]
    if window_width is not None and hasattr(window_width, '__iter__'):
        window_width = window_width[0]
        
    return data, window_center, window_width

def extract_slice_from_medical_image(
    file_path: str | Path,
    slice_index: int = None,
    window_center_override: float = None,
    window_width_override: float = None
):
    """
    Reads a medical image, extracts the requested slice,
    applies windowing (with optional overrides), and returns (bgr_image, total_slices, actual_slice_index).
    """
    file_path = Path(file_path)
    suffix = file_path.suffix.lower()
    
    data = None
    window_center = None
    window_width = None
    
    if suffix == ".nii" or file_path.name.lower().endswith(".nii.gz"):
        data = load_nifti_volume(file_path)
    elif suffix in [".dcm", ".dicom"]:
        data, window_center, window_width = load_dicom_volume(file_path)
    else:
        from .io_utils import load_image_bgr
        img = load_image_bgr(file_path)
        return img, 1, 0
        
    if data is None:
        raise ValueError(f"Unsupported or unreadable file format: {file_path}")
            
    total_slices = data.shape[0]
    
    if slice_index is None or slice_index < 0 or slice_index >= total_slices:
        slice_index = total_slices // 2
        
    slice_data = data[slice_index]

    wc = window_center_override if window_center_override is not None else window_center
    ww = window_width_override if window_width_override is not None else window_width
    
    slice_8bit = apply_windowing(slice_data, wc, ww)
    
    if slice_8bit.ndim == 2:
        slice_bgr = cv2.cvtColor(slice_8bit, cv2.COLOR_GRAY2BGR)
    elif slice_8bit.ndim == 3 and slice_8bit.shape[-1] == 3:
        slice_bgr = cv2.cvtColor(slice_8bit, cv2.COLOR_RGB2BGR)
    else:
        slice_bgr = slice_8bit
        
    return slice_bgr, total_slices, slice_index
