from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import BinaryIO

import numpy as np
from django.http import HttpResponse


class DicomPreviewError(Exception):
    pass


def is_dicom_path(path: str | None) -> bool:
    if not path:
        return False

    suffix = Path(path.split("?", 1)[0]).suffix.lower()
    return suffix in {".dcm", ".dicom"}


def _normalize_to_uint8(pixel_array, dataset):
    array = np.asarray(pixel_array)

    if array.ndim == 4:
        array = array[0]
    elif array.ndim == 3 and getattr(dataset, "SamplesPerPixel", 1) == 1:
        array = array[0]

    if array.ndim == 2:
        try:
            from pydicom.pixels import apply_voi_lut

            array = apply_voi_lut(array, dataset)
        except Exception:
            pass

        array = array.astype(np.float32)

        if getattr(dataset, "PhotometricInterpretation", "") == "MONOCHROME1":
            array = np.max(array) - array

        minimum = float(np.min(array))
        maximum = float(np.max(array))

        if maximum == minimum:
            return np.zeros_like(array, dtype=np.uint8)

        array = ((array - minimum) / (maximum - minimum) * 255.0).clip(0, 255)
        return array.astype(np.uint8)

    if array.ndim == 3:
        if array.dtype != np.uint8:
            array = array.astype(np.float32)
            minimum = float(np.min(array))
            maximum = float(np.max(array))

            if maximum == minimum:
                array = np.zeros_like(array, dtype=np.uint8)
            else:
                array = ((array - minimum) / (maximum - minimum) * 255.0).clip(0, 255).astype(np.uint8)

        return array

    raise DicomPreviewError("Unsupported DICOM pixel data shape")


def render_dicom_preview(file_handle: BinaryIO) -> bytes:
    try:
        import pydicom
    except ImportError as exc:
        raise DicomPreviewError("DICOM preview requires the 'pydicom' package to be installed") from exc

    try:
        from PIL import Image

        if hasattr(file_handle, "seek"):
            file_handle.seek(0)

        dataset = pydicom.dcmread(file_handle, force=True)
        pixel_array = dataset.pixel_array
        image_array = _normalize_to_uint8(pixel_array, dataset)
        image = Image.fromarray(image_array)

        output = BytesIO()
        image.save(output, format="PNG")
        return output.getvalue()
    except DicomPreviewError:
        raise
    except Exception as exc:
        raise DicomPreviewError(f"Failed to render DICOM preview: {exc}") from exc


def render_dicom_preview_response(file_handle: BinaryIO, filepath: str) -> HttpResponse:
    content = render_dicom_preview(file_handle)
    filename = f"{Path(filepath).stem}.png"

    response = HttpResponse(content, content_type="image/png")
    response["Content-Disposition"] = f'inline; filename="{filename}"'
    response["filename"] = filename
    return response
