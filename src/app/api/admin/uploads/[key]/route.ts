import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@netlify/blobs";

export const dynamic = "force-dynamic";

// Publicly serves an image previously saved by /api/admin/upload. This is
// deliberately NOT behind admin auth — product photos need to load for every
// visitor on the storefront, cart, product pages, etc, the same way a
// Firebase Storage download URL would have.
function imageStore() {
  return getStore({ name: "product-images", consistency: "strong" });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const store = imageStore();

  const result = await store.getWithMetadata(decodeURIComponent(key), { type: "arrayBuffer" });
  if (!result) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const contentType =
    (result.metadata as { contentType?: string } | undefined)?.contentType || "image/jpeg";

  return new NextResponse(result.data as ArrayBuffer, {
    headers: {
      "Content-Type": contentType,
      // Images are content-addressed by a random key that never gets reused,
      // so it's safe to cache them essentially forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
