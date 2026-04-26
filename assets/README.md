# Demo Datasets

This folder contains sample medical imaging data to quickly test and demonstrate the capabilities of the **RT-DETR+SAM Pipeline** without requiring external datasets.

## Included Files
- **`sample.jpg`**: A standard 2D image (e.g., a pre-extracted MRI slice). Useful for testing the basic Object Detection (RT-DETR) and 2D Segmentation (SAM) flows.
- **`sample.dcm`**: A DICOM file representing medical imaging data. Used to test the pipeline's ability to parse raw clinical formats and apply radiometric windowing (Hounsfield Unit mapping).
- **`sample.nii.gz`**: A compressed NIfTI volume (3D). Used to test the volumetric slice extraction capabilities (`slice_index` parameter) and 3D-to-2D projection mechanisms.

## Usage
You can directly upload any of these files via the React Frontend's **Image Uploader** component. 
The backend will automatically detect the format, apply necessary windowing or slicing, and return the inference overlays.
