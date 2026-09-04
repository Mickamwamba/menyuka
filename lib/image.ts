/**
 * Downscale on the phone before uploading. A modern phone camera JPEG is 3–8 MB;
 * over restaurant wifi that alone can blow the "photo to decision in under a
 * minute" budget. 1568px is the longest edge Claude's vision uses, so anything
 * beyond it costs upload time and buys nothing.
 */
const MAX_EDGE = 1568;
const QUALITY = 0.82;

export type PreparedImage = {
  media_type: "image/jpeg";
  data: string;
  /** Object URL for the preview thumbnail. */
  preview: string;
};

export async function prepareImage(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser can't process that photo.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob) throw new Error("Your browser can't process that photo.");

  const buffer = await blob.arrayBuffer();
  return {
    media_type: "image/jpeg",
    data: bytesToBase64(new Uint8Array(buffer)),
    preview: URL.createObjectURL(blob),
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
