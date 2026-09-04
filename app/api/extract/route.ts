import { NextResponse } from "next/server";
import { extractMenu, toClientError } from "@/lib/anthropic";

// Vision extraction from a phone photo is the slowest call in the flow.
export const maxDuration = 300;
export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGES = 4;
/** Base64 payload ceiling per image, roughly 4 MB of decoded pixels. */
const MAX_BASE64_LENGTH = 5_600_000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const images = body?.images;

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No photo received." }, { status: 400 });
    }
    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Up to ${MAX_IMAGES} pages at a time.` },
        { status: 400 },
      );
    }
    for (const image of images) {
      if (!ALLOWED.has(image?.media_type) || typeof image?.data !== "string") {
        return NextResponse.json({ error: "Unsupported image." }, { status: 400 });
      }
      if (image.data.length > MAX_BASE64_LENGTH) {
        return NextResponse.json({ error: "That photo is too large." }, { status: 413 });
      }
    }

    const menu = await extractMenu(images);

    if (menu.items.length === 0) {
      return NextResponse.json(
        { error: "We couldn't find any dishes. Try a straighter, closer photo." },
        { status: 422 },
      );
    }

    return NextResponse.json(menu);
  } catch (error) {
    const { message, status } = toClientError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
