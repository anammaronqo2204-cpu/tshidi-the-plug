import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@netlify/blobs";
import { isAdminAuthed } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Product photo storage, backed by Netlify Blobs — no Firebase Storage / Blaze
// plan required, since it's included free with every Netlify site.
//
// Flow: admin panel POSTs a single image file here -> we save the bytes into
// the "product-images" blob store under a unique key -> we return a URL
// pointing at /api/admin/uploads/[key], which streams the bytes back out
// publicly (see the route.ts next to this one) so <img> tags and the stored
// product.imageUrl work exactly like they did with Firebase download URLs.
function imageStore() {
  return getStore({ name: "product-images", consistency: "strong" });
}

function slugifyFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${slugifyFilename(file.name)}`;
  const arrayBuffer = await file.arrayBuffer();

  try {
    const store = imageStore();
    await store.set(key, arrayBuffer, {
      metadata: { contentType: file.type || "image/jpeg" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 },
    );
  }

  const url = `/api/admin/uploads/${encodeURIComponent(key)}`;
  return NextResponse.json({ url, key });
}
