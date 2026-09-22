// Browser-only helper. Shrinks a photo before it's uploaded to the shop.
//
// Why: phone / camera / exported PNGs are often 1–4 MB each. Every admin page and every
// shop page then has to download them at full size just to show an 80px thumbnail,
// which is the main reason the admin felt slow. A 1400px JPEG looks identical on screen
// and is usually 10x smaller.
//
// Safe by design: if the file is already small, isn't a normal photo type (gif / svg),
// or anything at all goes wrong, the ORIGINAL file is returned untouched, so an upload
// can never fail because of this step.

const MAX_EDGE = 1400; // px — plenty for the product page zoom, retina included
const JPEG_QUALITY = 0.85;
const LEAVE_ALONE_UNDER_BYTES = 300 * 1024;
const SHRINKABLE = /\.(png|jpe?g|webp|avif|bmp)$/i;

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

function mimeFromName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "";
}

function asFile(input: Blob, fileName: string): File {
  if (input instanceof File) return input;
  return new File([input], fileName, { type: input.type || mimeFromName(fileName) });
}

export async function shrinkImageForUpload(input: Blob, fileName: string): Promise<File> {
  const original = asFile(input, fileName);

  try {
    if (!SHRINKABLE.test(fileName)) return original;
    if (typeof createImageBitmap !== "function") return original;

    // Blobs pulled out of a zip have no type set; give the decoder a hint.
    const typed = original.type ? original : new File([original], fileName, { type: mimeFromName(fileName) });
    const bitmap = await createImageBitmap(typed);

    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_EDGE / longest);

    if (scale === 1 && original.size <= LEAVE_ALONE_UNDER_BYTES) {
      bitmap.close();
      return original;
    }

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return original;
    }

    // JPEG has no transparency — paint white first so transparent PNGs don't go black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const out = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );

    // Only use the result if it's genuinely smaller.
    if (!out || out.size >= original.size) return original;

    const newName = fileName.replace(/\.[a-z0-9]+$/i, "") + ".jpg";
    return new File([out], newName, { type: "image/jpeg" });
  } catch {
    return original;
  }
}
