import sys
import os
import io
import base64
import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from PIL import Image
from logger import get_logger

log = get_logger("analyze_router")

router = APIRouter()

def file_to_base64_url(file_path: str) -> str:
    """Helper to read image from disk and serialize to base64 Data URL"""
    try:
        with open(file_path, "rb") as f:
            img_bytes = f.read()
        img_str = base64.b64encode(img_bytes).decode("utf-8")
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        log.error(f"Error converting {file_path} to base64: {e}")
        return None

@router.post("/windowing")
async def apply_windowing(
    image: UploadFile = File(...),
    slice_index: int = Form(None),
    window_center: float = Form(None),
    window_width: float = Form(None)
):
    try:
        base_dir = Path(__file__).parent.parent
        temp_inputs_dir = base_dir / "temp_inputs"
        temp_inputs_dir.mkdir(parents=True, exist_ok=True)

        request_id = str(uuid.uuid4())
        ext = "".join(Path(image.filename).suffixes[-2:]) if image.filename.endswith(".gz") else Path(image.filename).suffix
        if not ext: ext = ".png"
            
        input_file_path = temp_inputs_dir / f"{request_id}_win{ext}"
        contents = await image.read()
        with open(input_file_path, "wb") as f:
            f.write(contents)

        from ml.medical_io import extract_slice_from_medical_image
        import cv2
        
        slice_bgr, total_slices, active_slice = extract_slice_from_medical_image(
            input_file_path, slice_index, window_center, window_width
        )
        
        slice_2d_path = temp_inputs_dir / f"{request_id}_win_slice.jpg"
        cv2.imwrite(str(slice_2d_path), slice_bgr)
        
        base_url = file_to_base64_url(str(slice_2d_path))
        
        if os.path.exists(input_file_path):
            os.remove(input_file_path)
            
        return JSONResponse(content={
            "base_url": base_url,
            "slice_index": active_slice,
            "total_slices": total_slices
        })
    except Exception as e:
        log.error(f"Error in /windowing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_image(
    request: Request,
    image: UploadFile = File(...),
    conf_threshold: float = Form(0.75),
    slice_index: int = Form(None),
    compute_device: str = Form("auto"),
    window_center: float = Form(None),
    window_width: float = Form(None)
):
    pipeline = getattr(request.app.state, "pipeline", None)
    if not pipeline:
        log.error("Analysis requested but ML Pipeline is not loaded.")
        raise HTTPException(status_code=503, detail="ML Pipeline is not loaded yet.")

    try:
        log.info(f"Incoming /analyze request for file: {image.filename} (slice: {slice_index}, compute_device: {compute_device})")
        base_dir = Path(__file__).parent.parent
        temp_inputs_dir = base_dir / "temp_inputs"
        temp_outputs_dir = base_dir / "temp_outputs"
        
        temp_inputs_dir.mkdir(parents=True, exist_ok=True)
        temp_outputs_dir.mkdir(parents=True, exist_ok=True)

        request_id = str(uuid.uuid4())
        
        ext = "".join(Path(image.filename).suffixes[-2:]) if image.filename.endswith(".gz") else Path(image.filename).suffix
        if not ext:
            ext = ".png"
            
        input_file_path = temp_inputs_dir / f"{request_id}{ext}"
        
        contents = await image.read()
        
        is_medical = ext.lower() in [".dcm", ".dicom", ".nii", ".nii.gz"]
        if not is_medical:
            try:
                Image.open(io.BytesIO(contents)).verify()
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")
            
        with open(input_file_path, "wb") as f:
            f.write(contents)

        from ml.medical_io import extract_slice_from_medical_image
        import cv2
        
        slice_bgr, total_slices, active_slice = extract_slice_from_medical_image(
            input_file_path, slice_index, window_center, window_width
        )
        
        slice_2d_path = temp_inputs_dir / f"{request_id}_slice.jpg"
        cv2.imwrite(str(slice_2d_path), slice_bgr)

        request_output_dir = temp_outputs_dir / request_id
        request_output_dir.mkdir(parents=True, exist_ok=True)

        import time
        import json
        import torch
        
        start_time = time.time()
        results = pipeline.run_on_image(
            image_path=slice_2d_path,
            output_dir=request_output_dir,
            conf_threshold=conf_threshold,
            iou_threshold=0.45,
            compute_device=compute_device
        )
        exec_time_ms = int((time.time() - start_time) * 1000)

        overlay_url = file_to_base64_url(results.overlay_path) if os.path.exists(results.overlay_path) else None
        
        base_url = file_to_base64_url(str(slice_2d_path))
        
        mask_urls = []
        for m_path in results.mask_paths:
            if os.path.exists(m_path):
                b64 = file_to_base64_url(m_path)
                if b64:
                    mask_urls.append(b64)

        raw_detections = {}
        if os.path.exists(results.json_path):
            with open(results.json_path, "r", encoding="utf-8") as f:
                raw_detections = json.load(f)
        response_data = {
            "overlay_url": overlay_url,
            "base_url": base_url,
            "mask_urls": mask_urls,
            "metadata": results.metadata,
            "json_output": {
                "system_status": {
                    "status": "success",
                    "request_id": request_id,
                    "execution_time_ms": exec_time_ms,
                    "cuda_available": torch.cuda.is_available(),
                    "device": pipeline.device,
                },
                "parameters": {
                    "conf_threshold": conf_threshold,
                    "model_type": pipeline.segmenter.model_type if hasattr(pipeline, 'segmenter') else "unknown"
                },
                "volume_info": {
                    "total_slices": total_slices,
                    "active_slice": active_slice,
                    "is_medical_volume": is_medical
                },
                "raw_detections": raw_detections
            }
        }

        return JSONResponse(content=response_data)

    except Exception as e:
        log.exception(f"Unhandled error during /analyze for {image.filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        try:
            req_id = locals().get('request_id', 'unknown')
            if 'input_file_path' in locals() and os.path.exists(input_file_path):
                os.remove(input_file_path)
            if 'slice_2d_path' in locals() and os.path.exists(slice_2d_path):
                os.remove(slice_2d_path)
            if 'request_output_dir' in locals() and os.path.exists(request_output_dir):
                shutil.rmtree(request_output_dir)
        except Exception as cleanup_err:
            log.error(f"Failed to cleanup temp files for request {req_id}: {cleanup_err}")

@router.post("/analyze/point")
async def analyze_point(
    request: Request,
    image: UploadFile = File(...),
    points: str = Form(...),
    labels: str = Form(...),
    compute_device: str = Form("auto")
):
    pipeline = getattr(request.app.state, "pipeline", None)
    if not pipeline:
        raise HTTPException(status_code=503, detail="ML Pipeline is not loaded yet.")

    import json
    try:
        point_coords = json.loads(points)
        point_labels = json.loads(labels)
    except Exception as e:
        log.error(f"Invalid points or labels JSON in /analyze/point: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid points or labels JSON: {e}")

    try:
        log.info(f"Incoming /analyze/point request. Points: {point_coords}")
        base_dir = Path(__file__).parent.parent
        temp_inputs_dir = base_dir / "temp_inputs"
        temp_outputs_dir = base_dir / "temp_outputs"
        
        request_id = str(uuid.uuid4())
        ext = Path(image.filename).suffix or ".png"
        input_file_path = temp_inputs_dir / f"{request_id}{ext}"
        
        contents = await image.read()
        with open(input_file_path, "wb") as f:
            f.write(contents)

        request_output_dir = temp_outputs_dir / request_id
        request_output_dir.mkdir(parents=True, exist_ok=True)

        import time
        import torch
        
        log.info(f"Running Interactive SAM Prompt for {request_id}")
        start_time = time.time()
        results = pipeline.run_interactive_prompt(
            image_path=input_file_path,
            output_dir=request_output_dir,
            point_coords=point_coords,
            point_labels=point_labels,
            compute_device=compute_device
        )
        exec_time_ms = int((time.time() - start_time) * 1000)
        log.info(f"Interactive SAM finished in {exec_time_ms}ms")

        overlay_url = file_to_base64_url(results.overlay_path) if os.path.exists(results.overlay_path) else None
        base_url = file_to_base64_url(str(input_file_path))
        
        mask_urls = []
        for m_path in results.mask_paths:
            if os.path.exists(m_path):
                b64 = file_to_base64_url(m_path)
                if b64: mask_urls.append(b64)

        response_data = {
            "overlay_url": overlay_url,
            "base_url": base_url,
            "mask_urls": mask_urls,
            "metadata": results.metadata,
            "sam_details": results.sam_details,
            "json_output": {
                "sam_info": results.sam_details,
                "system_status": {
                    "status": "success",
                    "request_id": request_id,
                    "execution_time_ms": exec_time_ms,
                }
            }
        }
        return JSONResponse(content=response_data)

    except Exception as e:
        log.exception(f"Unhandled error during /analyze/point: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        try:
            req_id = locals().get('request_id', 'unknown')
            if 'input_file_path' in locals() and os.path.exists(input_file_path):
                os.remove(input_file_path)
            if 'request_output_dir' in locals() and os.path.exists(request_output_dir):
                shutil.rmtree(request_output_dir)
        except Exception as cleanup_err:
            log.error(f"Failed to cleanup temp files for request {req_id}: {cleanup_err}")
