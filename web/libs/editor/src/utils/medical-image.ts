const MEDICAL_IMAGE_EXTENSIONS = [".dcm", ".dicom", ".svs", ".tif", ".tiff"];
const ABSOLUTE_URL_RE = /^[a-z][a-z\d+\-.]*:/i;

function parseURL(input: string) {
  return new URL(input, "http://localhost");
}

function serializeURL(url: URL, original: string) {
  if (ABSOLUTE_URL_RE.test(original) || original.startsWith("//")) return url.toString();
  return `${url.pathname}${url.search}${url.hash}`;
}

function hasMedicalImageExtension(path: string | null | undefined) {
  if (!path) return false;

  const normalizedPath = path.split("#", 1)[0].split("?", 1)[0].toLowerCase();

  return MEDICAL_IMAGE_EXTENSIONS.some((extension) => normalizedPath.endsWith(extension));
}

export function isMedicalImageUrl(url: string | null | undefined) {
  if (!url) return false;

  try {
    const parsed = parseURL(url);
    const filepath = parsed.searchParams.get("filepath");

    return hasMedicalImageExtension(filepath) || hasMedicalImageExtension(parsed.pathname);
  } catch {
    return hasMedicalImageExtension(url);
  }
}

export function getMedicalImagePreviewUrl(url: string) {
  if (!isMedicalImageUrl(url)) return url;

  const parsed = parseURL(url);

  parsed.searchParams.set("preview", "1");

  return serializeURL(parsed, url);
}
