from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import BinaryIO

import numpy as np
from django.http import HttpResponse


class MedicalImagePreviewError(Exception):
    pass


DICOM_EXTENSIONS = {'.dcm', '.dicom'}
WSI_EXTENSIONS = {'.svs', '.tif', '.tiff'}


def _get_suffix(path: str | None) -> str:
    if not path:
        return ''

    return Path(path.split('?', 1)[0]).suffix.lower()


def is_dicom_path(path: str | None) -> bool:
    return _get_suffix(path) in DICOM_EXTENSIONS


def is_wsi_path(path: str | None) -> bool:
    return _get_suffix(path) in WSI_EXTENSIONS


def is_medical_image_path(path: str | None) -> bool:
    suffix = _get_suffix(path)
    return suffix in DICOM_EXTENSIONS or suffix in WSI_EXTENSIONS


def _normalize_to_uint8(image_array, *, invert_grayscale: bool = False):
    array = np.asarray(image_array)

    if array.ndim == 4:
        array = array[0]

    if array.ndim == 3 and array.shape[0] in (1, 3, 4) and array.shape[-1] not in (3, 4):
        array = np.moveaxis(array, 0, -1)

    if array.ndim == 3 and array.shape[-1] == 1:
        array = array[..., 0]

    if array.ndim == 2:
        array = array.astype(np.float32)

        if invert_grayscale:
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

        if array.shape[-1] > 4:
            array = array[..., :3]

        return array

    raise MedicalImagePreviewError('Unsupported medical image pixel data shape')


def render_dicom_preview(file_handle: BinaryIO) -> bytes:
    try:
        import pydicom
    except ImportError as exc:
        raise MedicalImagePreviewError("DICOM preview requires the 'pydicom' package to be installed") from exc

    try:
        from PIL import Image

        if hasattr(file_handle, 'seek'):
            file_handle.seek(0)

        dataset = pydicom.dcmread(file_handle, force=True)
        pixel_array = dataset.pixel_array

        if pixel_array.ndim == 2:
            try:
                from pydicom.pixels import apply_voi_lut

                pixel_array = apply_voi_lut(pixel_array, dataset)
            except Exception:
                pass

        image_array = _normalize_to_uint8(
            pixel_array,
            invert_grayscale=getattr(dataset, 'PhotometricInterpretation', '') == 'MONOCHROME1',
        )
        image = Image.fromarray(image_array)

        output = BytesIO()
        image.save(output, format='PNG')
        return output.getvalue()
    except MedicalImagePreviewError:
        raise
    except Exception as exc:
        raise MedicalImagePreviewError(f'Failed to render DICOM preview: {exc}') from exc


def _select_wsi_series(tiff_file):
    series = [series for series in tiff_file.series if getattr(series, 'shape', None)]
    if not series:
        raise MedicalImagePreviewError('WSI file does not contain any readable image series')

    def score(series):
        shape = tuple(int(x) for x in series.shape)
        if len(shape) >= 2:
            return shape[-2] * shape[-1]
        return int(np.prod(shape))

    return min(series, key=score)


def render_wsi_preview(file_handle: BinaryIO) -> bytes:
    try:
        import tifffile
    except ImportError as exc:
        raise MedicalImagePreviewError("WSI preview requires the 'tifffile' package to be installed") from exc

    try:
        from PIL import Image

        if hasattr(file_handle, 'seek'):
            file_handle.seek(0)

        with tifffile.TiffFile(file_handle) as tiff_file:
            series = _select_wsi_series(tiff_file)
            image_array = series.asarray()

        image_array = _normalize_to_uint8(image_array)
        image = Image.fromarray(image_array)
        image.thumbnail((2048, 2048))

        output = BytesIO()
        image.save(output, format='PNG')
        return output.getvalue()
    except MedicalImagePreviewError:
        raise
    except Exception as exc:
        raise MedicalImagePreviewError(f'Failed to render WSI preview: {exc}') from exc


def render_medical_image_preview_response(file_handle: BinaryIO, filepath: str) -> HttpResponse:
    if is_dicom_path(filepath):
        content = render_dicom_preview(file_handle)
    elif is_wsi_path(filepath):
        content = render_wsi_preview(file_handle)
    else:
        raise MedicalImagePreviewError('Unsupported medical image format')

    filename = f'{Path(filepath).stem}.png'

    response = HttpResponse(content, content_type='image/png')
    response['Content-Disposition'] = f'inline; filename="{filename}"'
    response['filename'] = filename
    return response
