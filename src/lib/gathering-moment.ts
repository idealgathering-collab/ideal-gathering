/** Browser validation supplements (never replaces) private bucket enforcement. */
export function momentPhotoExtension(file: { type: string; size: number }) {
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) return null;
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}
