import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const term = (searchParams.get("term") || "").trim();
    if (!term) return NextResponse.json({ imageUrl: "" });

    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
    const r = await fetch(url, {
      headers: { "User-Agent": "ApplemedPrivate/1.0 (contact: none)" }
    });

    if (!r.ok) return NextResponse.json({ imageUrl: "" });

    const data = await r.json();

    // thumbnail.source عادة موجود لو في صورة
    const imageUrl =
      (data.thumbnail && data.thumbnail.source) ||
      (data.originalimage && data.originalimage.source) ||
      "";

    return NextResponse.json({ imageUrl });
  } catch {
    return NextResponse.json({ imageUrl: "" });
  }
}
